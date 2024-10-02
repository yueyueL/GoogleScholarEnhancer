// ==UserScript==
// @name         Google Scholar Enhancer
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  Enhance Google Scholar with column layout options and auto-paging
// @match        *://scholar.google.com/*
// @match        *://scholar.google.com.au/*
// @match        *://scholar.google.co.uk/*
// @match        *://scholar.google.ca/*
// @match        *://scholar.google.com.hk/*
// @match        *://scholar.google.co.in/*
// @match        *://scholar.google.co.jp/*
// @match        *://scholar.google.com.hk/*
// @match        *://scholar.google.de/*
// @match        *://scholar.google.fr/*
// @match        *://scholar.google.es/*
// @match        *://scholar.google.it/*
// @match        *://scholar.google.nl/*
// @match        *://scholar.google.com.sg/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    const config = {
        columnLayout: GM_getValue('columnLayout', 1),
        autoPagingEnabled: GM_getValue('autoPagingEnabled', true),
        bibtexCopyEnabled: GM_getValue('bibtexCopyEnabled', true),
        bibtexCopyAlert: GM_getValue('bibtexCopyAlert', true)
    };

    const styles = {
        singleColumn: `
            #gs_res_ccl_mid {
                display: block;
                max-width: 100%;
                margin: 0 auto;
            }
        `,
        doubleColumn: `
            #gs_res_ccl_mid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                grid-gap: 20px;
                max-width: 90vw;
                margin: 0 auto;
            }
            .gs_r.gs_or.gs_scl {
                width: 100%;
            }
        `,
        tripleColumn: `
            #gs_res_ccl_mid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                grid-gap: 20px;
                max-width: 95vw;
                margin: 0 auto;
            }
            .gs_r.gs_or.gs_scl {
                width: 100%;
            }
        `,
        common: `
            .gs_r.gs_or.gs_scl {
                border: 1px solid #ddd;
                padding: 10px;
                border-radius: 5px;
                margin-bottom: 10px;
                box-sizing: border-box;
            }
            #gs_top {
                max-width: 95vw;
                margin: 0 auto;
            }
            #gs_ab_md {
                max-width: none !important;
            }
        `
    };

    function addStyles() {
        GM_addStyle(styles.common);
        switch (config.columnLayout) {
            case 1:
                GM_addStyle(styles.singleColumn);
                break;
            case 2:
                GM_addStyle(styles.doubleColumn);
                break;
            case 3:
                GM_addStyle(styles.tripleColumn);
                break;
        }
    }

    function createLayoutSwitcher() {
        const switcher = document.createElement('select');
        switcher.innerHTML = `
            <option value="1" ${config.columnLayout === 1 ? 'selected' : ''}>Single Column</option>
            <option value="2" ${config.columnLayout === 2 ? 'selected' : ''}>Two Columns</option>
            <option value="3" ${config.columnLayout === 3 ? 'selected' : ''}>Three Columns</option>
        `;
        switcher.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999;';
        switcher.addEventListener('change', (e) => {
            config.columnLayout = parseInt(e.target.value);
            GM_setValue('columnLayout', config.columnLayout);
            addStyles();
        });
        document.body.appendChild(switcher);
    }

    function createSettingsButton() {
        const button = document.createElement('button');
        button.textContent = '⚙️ Settings';
        button.style.cssText = `
            padding: 5px 10px;
            margin-right: 10px;
            background-color: #f1f3f4;
            border: 1px solid #dadce0;
            border-radius: 4px;
            color: #202124;
            font-family: arial,sans-serif;
            font-size: 14px;
            cursor: pointer;
        `;
        button.addEventListener('click', openSettingsModal);

        // Find the profile button container
        const profileContainer = document.querySelector('#gs_hdr_drw');
        if (profileContainer) {
            // Insert our button before the profile container
            profileContainer.parentNode.insertBefore(button, profileContainer);
        } else {
            // Fallback: append to the header if profile container is not found
            const header = document.querySelector('#gs_top');
            if (header) {
                header.appendChild(button);
            }
        }
    }

    function createSettingsModal() {
        const modalOverlay = document.createElement('div');
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            z-index: 9999;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
            z-index: 10000;
        `;
        modal.innerHTML = `
            <h2>Google Scholar Enhancer Settings</h2>
            <label>
                Column Layout:
                <select id="columnLayout">
                    <option value="1" ${config.columnLayout === 1 ? 'selected' : ''}>Single Column</option>
                    <option value="2" ${config.columnLayout === 2 ? 'selected' : ''}>Two Columns</option>
                    <option value="3" ${config.columnLayout === 3 ? 'selected' : ''}>Three Columns</option>
                </select>
            </label>
            <br><br>
            <label>
                <input type="checkbox" id="autoPaging" ${config.autoPagingEnabled ? 'checked' : ''}>
                Enable Automatic Page Turning
            </label>
            <br><br>
            <label>
                <input type="checkbox" id="bibtexCopy" ${config.bibtexCopyEnabled ? 'checked' : ''}>
                Enable Direct BibTeX Copying
            </label>
            <br><br>
            <label>
                <input type="checkbox" id="bibtexCopyAlert" ${config.bibtexCopyAlert ? 'checked' : ''}>
                Show Alert on BibTeX Copy
            </label>
            <br><br>
            <button id="saveSettings">Save</button>
            <button id="closeSettings">Close</button>
        `;

        modalOverlay.appendChild(modal);
        return modalOverlay;
    }

    function openSettingsModal() {
        const modalOverlay = createSettingsModal();
        document.body.appendChild(modalOverlay);

        const closeModal = () => {
            document.body.removeChild(modalOverlay);
        };

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });

        document.getElementById('saveSettings').addEventListener('click', () => {
            config.columnLayout = parseInt(document.getElementById('columnLayout').value);
            config.autoPagingEnabled = document.getElementById('autoPaging').checked;
            config.bibtexCopyEnabled = document.getElementById('bibtexCopy').checked;
            config.bibtexCopyAlert = document.getElementById('bibtexCopyAlert').checked;
            GM_setValue('columnLayout', config.columnLayout);
            GM_setValue('autoPagingEnabled', config.autoPagingEnabled);
            GM_setValue('bibtexCopyEnabled', config.bibtexCopyEnabled);
            GM_setValue('bibtexCopyAlert', config.bibtexCopyAlert);
            addStyles();
            if (config.autoPagingEnabled) {
                initAutoPaging();
            }
            if (config.bibtexCopyEnabled) {
                initBibtexCopy();
            }
            closeModal();
        });

        document.getElementById('closeSettings').addEventListener('click', closeModal);
    }

    function initAutoPaging() {
        const pager = {
            nextLink: '//a[./span[@class="gs_ico gs_ico_nav_next"]]',
            pageElement: '//div[@class="gs_r gs_or gs_scl"]',
            HT_insert: ["#gs_res_ccl_mid", 2],
            replaceE: '//div[@id="gs_n"]'
        };

        let curSite = {
            SiteTypeID: 4.1,
            pager: pager
        };

        const getElementByXpath = function(xpath, contextNode) {
            contextNode = contextNode || document;
            try {
                const result = document.evaluate(xpath, contextNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                return result.singleNodeValue && result.singleNodeValue.nodeType === 1 && result.singleNodeValue;
            } catch (err) {
                console.error(`Invalid xpath: ${xpath}`);
            }
        };

        const getAllElementsByXpath = function(xpath, contextNode) {
            contextNode = contextNode || document;
            const result = [];
            try {
                const query = document.evaluate(xpath, contextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                for (let i = 0; i < query.snapshotLength; i++) {
                    const node = query.snapshotItem(i);
                    if (node.nodeType === 1) result.push(node);
                }
            } catch (err) {
                console.error(`Invalid xpath: ${xpath}`);
            }
            return result;
        };

        const loadMoreResults = async function() {
            const nextLink = getElementByXpath(curSite.pager.nextLink);
            if (!nextLink) return;

            const pageElements = getAllElementsByXpath(curSite.pager.pageElement);
            if (pageElements.length === 0) return;

            const insertPoint = document.querySelector(curSite.pager.HT_insert[0]);
            if (!insertPoint) return;

            try {
                const response = await fetch(nextLink.href);
                const text = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');

                const newPageElements = getAllElementsByXpath(curSite.pager.pageElement, doc);

                newPageElements.forEach(elem => {
                    if (curSite.pager.HT_insert[1] === 2) {
                        insertPoint.appendChild(elem);
                    } else {
                        insertPoint.insertBefore(elem, insertPoint.firstChild);
                    }
                });

                const replaceE = getElementByXpath(curSite.pager.replaceE);
                if (replaceE) {
                    const newReplaceE = getElementByXpath(curSite.pager.replaceE, doc);
                    if (newReplaceE) {
                        replaceE.parentNode.replaceChild(newReplaceE, replaceE);
                    }
                }

            } catch (error) {
                console.error('Error loading more results:', error);
            }
        };

        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = document.documentElement.clientHeight;

            if (scrollTop + clientHeight >= scrollHeight - 200) {
                loadMoreResults();
            }
        });
    }

    function initBibtexCopy() {
        document.addEventListener('click', function(event) {
            if (config.bibtexCopyEnabled && event.target.textContent.includes('BibTeX')) {
                event.preventDefault();
                event.stopPropagation();
                
                const bibtexLink = event.target.closest('a');
                if (!bibtexLink) return;

                const bibtexUrl = bibtexLink.href;
                
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: bibtexUrl,
                    onload: function(response) {
                        if (response.status === 200) {
                            GM_setClipboard(response.responseText);
                            if (config.bibtexCopyAlert) {
                                alert('BibTeX copied to clipboard');
                            }
                        } else {
                            console.error('Failed to fetch BibTeX');
                            alert('Failed to copy BibTeX');
                        }
                    },
                    onerror: function(error) {
                        console.error('Error fetching BibTeX:', error);
                        alert('Error copying BibTeX');
                    }
                });
            }
        });
    }

    function init() {
        if (document.querySelector('#gs_res_ccl_mid')) {
            addStyles();
            setTimeout(() => {
                createSettingsButton();
            }, 500);
            if (config.autoPagingEnabled) {
                initAutoPaging();
            }
            initBibtexCopy(); // Always initialize
        }
    }

    // Run the script
    init();
})();