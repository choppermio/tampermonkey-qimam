// ==UserScript==
// @name         Filter Select Options - Merge Filters with Prefix Removal
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Merge filters ignoring spaces, 'و' spaces, and remove "قسم" prefix to combine similar filters - for https://www.qimam.org.sa/rafed/operations_request.php only
// @match        https://www.qimam.org.sa/rafed/operations_request.php
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    window.addEventListener('load', () => {
        const select = document.querySelector('.data_table select');
        if (!select) {
            console.warn('[Tampermonkey] Select element inside .data_table not found');
            return;
        }

        const options = Array.from(select.options).slice(1);

        function normalizeFilterText(text) {
            let t = text.trim().replace(/\s+/g, ' ');
            t = t.replace(/\s?و\s?/g, 'و');
            t = t.replace(/^قسم\s+/i, ''); // إزالة "قسم " من البداية (case-insensitive)
            return t;
        }

        function extractParenthesesText(text) {
            const match = text.match(/\(([^)]+)\)/);
            return match ? normalizeFilterText(match[1]) : null;
        }

        // سنحتفظ أيضاً بنص العرض الأصلي لأحد العناصر ضمن المجموعة ليكون اسم الزر
        const filtersMap = new Map();
        let hasGeneral = false;

        options.forEach(opt => {
            const pTextRaw = extractParenthesesText(opt.text);
            if (pTextRaw) {
                if (!filtersMap.has(pTextRaw)) {
                    // نحاول إيجاد نص العرض المناسب (مثلاً بدون "قسم" إن وجد)
                    // لكن نعرض النص بدون إزالة "قسم" لكي يظهر زر جميل
                    let displayText = opt.text.match(/\(([^)]+)\)/);
                    displayText = displayText ? displayText[1].trim() : pTextRaw;
                    filtersMap.set(pTextRaw, displayText);
                }
            } else {
                hasGeneral = true;
            }
        });

        // نحصل على المفاتيح (النصوط normalized)
        const filters = Array.from(filtersMap.keys()).sort();

        const container = document.createElement('div');
        container.style.margin = '10px 0';
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
        container.style.gap = '8px';

        function createFilterButton(name) {
            const btn = document.createElement('button');
            btn.textContent = name;
            btn.style.padding = '6px 12px';
            btn.style.border = '1.5px solid #007BFF';
            btn.style.borderRadius = '6px';
            btn.style.backgroundColor = 'white';
            btn.style.color = '#007BFF';
            btn.style.cursor = 'pointer';
            btn.style.fontSize = '14px';
            btn.style.transition = 'background-color 0.3s, color 0.3s';
            btn.addEventListener('mouseenter', () => {
                btn.style.backgroundColor = '#007BFF';
                btn.style.color = 'white';
            });
            btn.addEventListener('mouseleave', () => {
                if (!btn.classList.contains('active')) {
                    btn.style.backgroundColor = 'white';
                    btn.style.color = '#007BFF';
                }
            });
            return btn;
        }

        let activeButton = null;
        function setActiveButton(btn) {
            if (activeButton) {
                activeButton.classList.remove('active');
                activeButton.style.backgroundColor = 'white';
                activeButton.style.color = '#007BFF';
            }
            activeButton = btn;
            if (btn) {
                btn.classList.add('active');
                btn.style.backgroundColor = '#007BFF';
                btn.style.color = 'white';
            }
        }

        const btnAll = createFilterButton('كل الخيارات');
        container.appendChild(btnAll);

        btnAll.addEventListener('click', e => {
            e.preventDefault();
            showAllOptions();
            setActiveButton(btnAll);
        });

        filters.forEach(normText => {
            const btn = createFilterButton(filtersMap.get(normText));
            container.appendChild(btn);
            btn.addEventListener('click', e => {
                e.preventDefault();
                filterOptions(normText);
                setActiveButton(btn);
            });
        });

        if (hasGeneral) {
            const btnGeneral = createFilterButton('عام');
            container.appendChild(btnGeneral);
            btnGeneral.addEventListener('click', e => {
                e.preventDefault();
                filterOptions(null);
                setActiveButton(btnGeneral);
            });
        }

        select.parentNode.insertBefore(container, select);

        function showAllOptions() {
            select.options[0].hidden = false;
            options.forEach(opt => opt.hidden = false);
            select.selectedIndex = 0;
        }

        function filterOptions(filterText) {
            select.options[0].hidden = false;
            options.forEach(opt => {
                const pText = extractParenthesesText(opt.text);
                if (filterText === null) {
                    opt.hidden = pText !== null;
                } else {
                    opt.hidden = pText !== filterText;
                }
            });
            select.selectedIndex = 0;
        }

        showAllOptions();
        setActiveButton(btnAll);
    });
})();
