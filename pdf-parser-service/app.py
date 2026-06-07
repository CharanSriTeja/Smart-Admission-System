import os
import io
import pdfplumber
from flask import Flask, request, jsonify

app = Flask(__name__)

# Column mapping dictionary to standardize extracted headers
COLUMN_MAP = {
    # hallTicketNumber
    'hallticketno': 'hallTicketNumber',
    'hallticketnumber': 'hallTicketNumber',
    'hall_ticket_no': 'hallTicketNumber',
    'hall_ticket_number': 'hallTicketNumber',
    'hall ticket': 'hallTicketNumber',
    'hall ticket no': 'hallTicketNumber',
    'hall ticket number': 'hallTicketNumber',
    'htno': 'hallTicketNumber',
    'ht no': 'hallTicketNumber',
    'ht_no': 'hallTicketNumber',
    'hallticket': 'hallTicketNumber',

    # name
    'name': 'name',
    'student name': 'name',
    'studentname': 'name',
    'student_name': 'name',
    'full name': 'name',
    'fullname': 'name',

    # rank
    'rank': 'rank',
    'eamcet rank': 'rank',
    'eamcetrank': 'rank',
    'eamcet_rank': 'rank',
    'merit rank': 'rank',

    # department
    'department': 'department',
    'dept': 'department',
    'branch': 'department',

    # studentPhone
    'studentphone': 'studentPhone',
    'student phone': 'studentPhone',
    'student_phone': 'studentPhone',
    'student mobile': 'studentPhone',
    'phone': 'studentPhone',
    'mobile': 'studentPhone',
    'contact': 'studentPhone',

    # parentPhone
    'parentphone': 'parentPhone',
    'parent phone': 'parentPhone',
    'parent_phone': 'parentPhone',
    'parent mobile': 'parentPhone',
    'guardian phone': 'parentPhone',
    'guardian mobile': 'parentPhone',

    # email
    'email': 'email',
    'email id': 'email',
    'emailid': 'email',
    'email_id': 'email',
    'student email': 'email',

    # category
    'category': 'category',
    'caste': 'category',
    'reservation': 'category',

    # gender
    'gender': 'gender',
    'sex': 'gender',

    # region
    'region': 'region',
    'university': 'region',
}

def map_column(raw):
    if not raw:
        return None
    key = str(raw).strip().lower().replace('_', ' ').replace('-', ' ')
    key = ' '.join(key.split())
    if key in COLUMN_MAP:
        return COLUMN_MAP[key]
    collapsed = key.replace(' ', '')
    if collapsed in COLUMN_MAP:
        return COLUMN_MAP[collapsed]
    return None

def reconstruct_table_from_words(page):
    words = page.extract_words()
    if not words:
        return []
    
    # Group words into lines based on visual vertical overlap
    lines_dict = {}
    for w in words:
        found = False
        for top_y in lines_dict.keys():
            if abs(top_y - w['top']) < 3:
                lines_dict[top_y].append(w)
                found = True
                break
        if not found:
            lines_dict[w['top']] = [w]
    
    sorted_y = sorted(lines_dict.keys())
    
    raw_rows = []
    for y in sorted_y:
        line_words = sorted(lines_dict[y], key=lambda w: w['x0'])
        cells = []
        current_cell = []
        for w in line_words:
            if not current_cell:
                current_cell.append(w)
            else:
                prev_w = current_cell[-1]
                gap = w['x0'] - prev_w['x1']
                # If gap is small (less than 12 points), merge words into the same cell value
                if gap < 12:
                    current_cell.append(w)
                else:
                    cell_text = " ".join([word['text'] for word in current_cell])
                    cells.append(cell_text)
                    current_cell = [w]
        if current_cell:
            cell_text = " ".join([word['text'] for word in current_cell])
            cells.append(cell_text)
        
        if cells:
            raw_rows.append(cells)
    return raw_rows

@app.route('/parse', methods=['POST'])
def parse_pdf():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file part in the request'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No selected file'}), 400

    students = []
    try:
        file_bytes = file.read()
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            all_rows = []
            for page in pdf.pages:
                # 1. Try standard line-based tables
                tables = page.extract_tables()
                page_rows = []
                for table in tables:
                    for row in table:
                        cleaned_row = [str(item).strip() if item is not None else "" for item in row]
                        if any(cleaned_row):
                            page_rows.append(cleaned_row)
                
                # 2. Fall back to custom word-position parser if no tabular grid lines are found
                if not page_rows:
                    page_rows = reconstruct_table_from_words(page)
                
                all_rows.extend(page_rows)
            
            if len(all_rows) < 2:
                return jsonify({'success': True, 'students': []})

            # Identify the header row containing at least 3 mandatory fields
            header_index = -1
            headers = []
            for i, row in enumerate(all_rows):
                mapped_cols = [map_column(c) for c in row if c]
                mapped_cols = [c for c in mapped_cols if c is not None]
                mandatory_count = sum(1 for f in ['hallTicketNumber', 'name', 'rank', 'department'] if f in mapped_cols)
                if mandatory_count >= 3:
                    header_index = i
                    headers = [map_column(c) if map_column(c) else c for c in row]
                    break

            if header_index == -1:
                # Fallback to the first non-empty row containing headers
                header_index = 0
                headers = [map_column(c) if map_column(c) else c for c in all_rows[0]]

            # Parse data rows starting after the header
            for i in range(header_index + 1, len(all_rows)):
                row = all_rows[i]
                student = {}
                for idx, val in enumerate(row):
                    if idx < len(headers):
                        col_name = headers[idx]
                        if col_name in ['hallTicketNumber', 'name', 'rank', 'department', 
                                        'studentPhone', 'parentPhone', 'email', 'category', 'gender', 'region']:
                            student[col_name] = val

                # Clean and validate required fields
                if student.get('hallTicketNumber') and student.get('name') and student.get('rank') and student.get('department'):
                    students.append(student)

        return jsonify({'success': True, 'students': students})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
