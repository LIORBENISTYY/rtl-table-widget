(function() {
    let template = document.createElement("template");
    template.innerHTML = `
        <style>
            :host {
                display: block;
                width: 100%;
                height: 100%;
                font-family: Arial, sans-serif;
            }
            .rtl-container {
                direction: rtl;
                text-align: right;
                width: 100%;
                height: 100%;
                padding: 15px;
                box-sizing: border-box;
                background: #f9f9f9;
            }
            .table-title {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 15px;
                color: #2c3e50;
                text-align: right;
            }
            .rtl-table {
                width: 100%;
                border-collapse: collapse;
                direction: rtl;
                background: white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                border-radius: 8px;
                overflow: hidden;
            }
            .rtl-table th {
                background-color: #3498db;
                color: white;
                padding: 15px 12px;
                text-align: right;
                font-weight: bold;
                border-bottom: 2px solid #2980b9;
            }
            .rtl-table td {
                padding: 12px;
                text-align: right;
                border-bottom: 1px solid #ecf0f1;
                cursor: pointer;
                transition: background-color 0.3s;
            }
            .rtl-table tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            .rtl-table tr:hover {
                background-color: #e8f4fd;
            }
            .rtl-table tr:last-child td {
                border-bottom: none;
            }
            .no-data {
                text-align: center;
                padding: 30px;
                color: #7f8c8d;
                font-style: italic;
                font-size: 16px;
            }
        </style>
        <div class="rtl-container">
            <div class="table-title" id="title">טבלת נתוני SAP</div>
            <table class="rtl-table" id="mainTable">
                <thead id="tableHead"></thead>
                <tbody id="tableBody"></tbody>
            </table>
        </div>
    `;

    class DynamicRTLTable extends HTMLElement {
        constructor() {
            super();
            this._shadowRoot = this.attachShadow({mode: "open"});
            this._shadowRoot.appendChild(template.content.cloneNode(true));
            
            // Initialize properties
            this._tableTitle = "טבלת נתוני SAP";
            this._tableData = [];
            
            this._setupEventListeners();
        }

        connectedCallback() {
            this._render();
        }

        onCustomWidgetAfterUpdate(changedProperties) {
            this._render();
        }

        onCustomWidgetBeforeUpdate(changedProperties) {
            // Handle data binding updates
            if (changedProperties["myBinding"]) {
                this._processSAPData(changedProperties["myBinding"]);
            }
        }

        _setupEventListeners() {
            this._shadowRoot.addEventListener('click', (event) => {
                if (event.target.tagName === 'TD') {
                    const row = event.target.parentNode;
                    const tbody = this._shadowRoot.getElementById("tableBody");
                    const rowIndex = Array.from(tbody.children).indexOf(row);
                    
                    if (rowIndex >= 0 && this._tableData[rowIndex]) {
                        const clickEvent = new CustomEvent("onRowClick", {
                            detail: {
                                rowIndex: rowIndex,
                                rowData: this._tableData[rowIndex],
                                cellValue: event.target.textContent
                            }
                        });
                        this.dispatchEvent(clickEvent);
                        
                        // Visual feedback
                        row.style.backgroundColor = '#d4edda';
                        setTimeout(() => {
                            row.style.backgroundColor = '';
                        }, 200);
                    }
                }
            });
        }

        _render() {
            const title = this._shadowRoot.getElementById("title");
            const tableHead = this._shadowRoot.getElementById("tableHead");
            const tableBody = this._shadowRoot.getElementById("tableBody");
            
            title.textContent = this._tableTitle;
            
            tableHead.innerHTML = "";
            tableBody.innerHTML = "";
            
            if (!this._tableData || this._tableData.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="100%" class="no-data">יש לגרור נתונים מהבונה לטבלה<br/>Drag data from Builder to the table</td></tr>';
                return;
            }
            
            // Create table header
            const headerRow = document.createElement("tr");
            const columns = Object.keys(this._tableData[0]);
            
            columns.forEach(column => {
                const th = document.createElement("th");
                th.textContent = column;
                headerRow.appendChild(th);
            });
            tableHead.appendChild(headerRow);
            
            // Create table body
            this._tableData.forEach((rowData) => {
                const row = document.createElement("tr");
                
                columns.forEach(column => {
                    const td = document.createElement("td");
                    td.textContent = rowData[column] || "";
                    row.appendChild(td);
                });
                
                tableBody.appendChild(row);
            });
        }

        _processSAPData(dataBinding) {
            if (!dataBinding || !dataBinding.data) {
                this._tableData = [];
                this._render();
                return;
            }

            const sapData = dataBinding.data;
            const processedData = [];
            
            sapData.forEach(row => {
                const rowData = {};
                
                // Process dimensions (text fields)
                Object.keys(row).forEach(key => {
                    if (key.startsWith('dimensions_')) {
                        const dimValue = row[key];
                        rowData[dimValue.label || dimValue.id || key] = dimValue.description || dimValue.label || dimValue.id;
                    }
                });
                
                // Process measures (numeric fields)
                Object.keys(row).forEach(key => {
                    if (key.startsWith('measures_')) {
                        const measureValue = row[key];
                        rowData[measureValue.label || measureValue.id || key] = measureValue.formatted || measureValue.raw || measureValue.value;
                    }
                });
                
                processedData.push(rowData);
            });
            
            this._tableData = processedData;
            this._render();
        }

        // Property getters and setters
        get tableTitle() {
            return this._tableTitle;
        }

        set tableTitle(value) {
            this._tableTitle = value || "טבלת נתוני SAP";
        }

        // Public methods
        setTableData(data) {
            try {
                if (typeof data === 'string') {
                    this._tableData = JSON.parse(data);
                } else if (Array.isArray(data)) {
                    this._tableData = data;
                } else {
                    this._tableData = [];
                }
                this._render();
            } catch (error) {
                console.error('Error setting table data:', error);
                this._tableData = [];
                this._render();
            }
        }

        getTableData() {
            return this._tableData;
        }
    }

    customElements.define("dynamic-rtl-table", DynamicRTLTable);
})();
