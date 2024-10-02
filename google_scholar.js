// ==UserScript==
// @name         Google Scholar Enhancer
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  Enhance Google Scholar with column layout options and auto-paging
// @icon         https://www.google.com/s2/favicons?domain=scholar.google.com
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
        bibtexCopyAlert: GM_getValue('bibtexCopyAlert', true),
        singleResultRedirect: GM_getValue('singleResultRedirect', true),
        showFrequentScholars: GM_getValue('showFrequentScholars', true),
        language: GM_getValue('language', 'en')
    };

    const translations = {
        en: {
            settings: '⚙️ Settings',
            keywords: 'Keywords:',
            exactPhrase: 'Exact phrase:',
            without: 'Without:',
            author: 'Author:',
            publishedIn: 'Published in:',
            titleOnly: 'Title only',
            apply: 'Apply',
            settingsTitle: 'Google Scholar Enhancer Settings',
            layoutOptions: 'Layout Options',
            columnLayout: 'Column Layout:',
            singleColumn: 'Single Column',
            twoColumns: 'Two Columns',
            threeColumns: 'Three Columns',
            navigationOptions: 'Navigation Options',
            enableAutoPaging: 'Enable Automatic Page Turning',
            autoRedirect: 'Auto-redirect for Single Results',
            bibtexOptions: 'BibTeX Options',
            enableDirectBibtex: 'Enable Direct BibTeX Copying',
            showBibtexAlert: 'Show Alert on BibTeX Copy',
            additionalFeatures: 'Additional Features',
            showFrequentScholars: 'Show Frequent Scholars',
            language: 'Language',
            save: 'Save',
            close: 'Close',
            allOfTheWords: 'All of the words',
            withoutWords: 'Without words',
            journalOrConference: 'Journal or conference'
        },
        zh: {
            settings: '⚙️ 设置',
            keywords: '关键词：',
            exactPhrase: '精确短语：',
            without: '不包含：',
            author: '作者：',
            publishedIn: '发表于：',
            titleOnly: '仅标题',
            apply: '应用',
            settingsTitle: 'Google Scholar 增强设置',
            layoutOptions: '布局选项',
            columnLayout: '列布局：',
            singleColumn: '单列',
            twoColumns: '双列',
            threeColumns: '三列',
            navigationOptions: '导航选项',
            enableAutoPaging: '启用自动翻页',
            autoRedirect: '单一结果自动重定向',
            bibtexOptions: 'BibTeX 选项',
            enableDirectBibtex: '启用直接 BibTeX 复制',
            showBibtexAlert: '显示 BibTeX 复制提醒',
            additionalFeatures: '附加功能',
            showFrequentScholars: '显示常见学者',
            language: '语言',
            save: '保',
            close: '关闭',
            allOfTheWords: '包含所有这些词',
            withoutWords: '不包含这些词',
            journalOrConference: '期刊或会议'
        }
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
        const lang = translations[config.language];
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding: 5px 10px;
            background-color: #f1f3f4;
            border-bottom: 1px solid #dadce0;
            z-index: 1000;
        `;

        const settingsButton = document.createElement('button');
        settingsButton.id = 'settings-button';
        settingsButton.textContent = lang.settings;
        settingsButton.style.cssText = `
            padding: 5px 10px;
            margin-right: 10px;
            background-color: #fff;
            border: 1px solid #dadce0;
            border-radius: 4px;
            color: #202124;
            font-family: arial,sans-serif;
            font-size: 14px;
            cursor: pointer;
        `;
        settingsButton.addEventListener('click', openSettingsModal);

        container.appendChild(settingsButton);

        const advancedSearchFields = [
            { label: lang.keywords, id: 'all-words', width: '150px', placeholder: lang.allOfTheWords },
            { label: lang.exactPhrase, id: 'exact-phrase', width: '150px' },
            { label: lang.without, id: 'without-words', width: '150px', placeholder: lang.withoutWords },
            { label: lang.author, id: 'author', width: '150px' },
            { label: lang.publishedIn, id: 'publication', width: '150px', placeholder: lang.journalOrConference }
        ];

        advancedSearchFields.forEach((field, index) => {
            const fieldContainer = document.createElement('div');
            fieldContainer.style.marginLeft = '10px';
            fieldContainer.style.display = 'flex';
            fieldContainer.style.alignItems = 'center';

            const label = document.createElement('label');
            label.textContent = field.label;
            label.style.marginRight = '5px';

            const input = document.createElement('input');
            input.type = 'text';
            input.id = field.id;
            input.style.width = field.width;
            input.style.padding = '2px 5px';
            if (field.placeholder) {
                input.placeholder = field.placeholder;
            }

            fieldContainer.appendChild(label);
            fieldContainer.appendChild(input);

            // Add "Title only" checkbox after the keywords input
            if (index === 0) {
                const titleOnlyLabel = document.createElement('label');
                titleOnlyLabel.style.marginLeft = '5px';
                titleOnlyLabel.style.display = 'flex';
                titleOnlyLabel.style.alignItems = 'center';

                const titleOnlyCheckbox = document.createElement('input');
                titleOnlyCheckbox.type = 'checkbox';
                titleOnlyCheckbox.id = 'title-only';
                titleOnlyCheckbox.style.marginRight = '5px';

                titleOnlyLabel.appendChild(titleOnlyCheckbox);
                titleOnlyLabel.appendChild(document.createTextNode(lang.titleOnly));

                fieldContainer.appendChild(titleOnlyLabel);
            }

            container.appendChild(fieldContainer);
        });

        const applyButton = document.createElement('button');
        applyButton.id = 'apply-button';
        applyButton.textContent = lang.apply;
        applyButton.style.cssText = `
            padding: 5px 10px;
            margin-left: 10px;
            background-color: #4285f4;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        applyButton.addEventListener('click', applyAdvancedSearch);

        container.appendChild(applyButton);

        const body = document.body;
        body.insertBefore(container, body.firstChild);
        body.style.paddingTop = `${container.offsetHeight}px`;
    }

    function createSettingsModal() {
        const lang = translations[config.language];
        const modalOverlay = document.createElement('div');
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08);
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        `;

        modal.innerHTML = `
            <h2 style="margin-top: 0; color: #1a73e8; font-size: 24px; margin-bottom: 20px;">${lang.settingsTitle}</h2>
            <div style="display: grid; gap: 20px;">
                <div style="border: 1px solid #e0e0e0; padding: 15px; border-radius: 4px;">
                    <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 18px;">${lang.layoutOptions}</h3>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">${lang.columnLayout}</label>
                        <select id="columnLayout" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="1" ${config.columnLayout === 1 ? 'selected' : ''}>${lang.singleColumn}</option>
                            <option value="2" ${config.columnLayout === 2 ? 'selected' : ''}>${lang.twoColumns}</option>
                            <option value="3" ${config.columnLayout === 3 ? 'selected' : ''}>${lang.threeColumns}</option>
                        </select>
                    </div>
                </div>
                <div style="border: 1px solid #e0e0e0; padding: 15px; border-radius: 4px;">
                    <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 18px;">${lang.navigationOptions}</h3>
                    <div>
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="autoPaging" ${config.autoPagingEnabled ? 'checked' : ''} style="margin-right: 10px;">
                            <span>${lang.enableAutoPaging}</span>
                        </label>
                    </div>
                    <div style="margin-top: 10px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="singleResultRedirect" ${config.singleResultRedirect ? 'checked' : ''} style="margin-right: 10px;">
                            <span>${lang.autoRedirect}</span>
                        </label>
                    </div>
                </div>
                <div style="border: 1px solid #e0e0e0; padding: 15px; border-radius: 4px;">
                    <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 18px;">${lang.bibtexOptions}</h3>
                    <div>
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="bibtexCopy" ${config.bibtexCopyEnabled ? 'checked' : ''} style="margin-right: 10px;">
                            <span>${lang.enableDirectBibtex}</span>
                        </label>
                    </div>
                    <div style="margin-top: 10px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="bibtexCopyAlert" ${config.bibtexCopyAlert ? 'checked' : ''} style="margin-right: 10px;">
                            <span>${lang.showBibtexAlert}</span>
                        </label>
                    </div>
                </div>
                <div style="border: 1px solid #e0e0e0; padding: 15px; border-radius: 4px;">
                    <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 18px;">${lang.additionalFeatures}</h3>
                    <div>
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="showFrequentScholars" ${config.showFrequentScholars ? 'checked' : ''} style="margin-right: 10px;">
                            <span>${lang.showFrequentScholars}</span>
                        </label>
                    </div>
                </div>
                <div style="border: 1px solid #e0e0e0; padding: 15px; border-radius: 4px;">
                    <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 18px;">${lang.language}</h3>
                    <div>
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="radio" name="language" value="en" ${config.language === 'en' ? 'checked' : ''} style="margin-right: 10px;">
                            <span>English</span>
                        </label>
                    </div>
                    <div style="margin-top: 10px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="radio" name="language" value="zh" ${config.language === 'zh' ? 'checked' : ''} style="margin-right: 10px;">
                            <span>中文</span>
                        </label>
                    </div>
                </div>
            </div>
            <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
                <button id="saveSettings" style="background-color: #1a73e8; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">${lang.save}</button>
                <button id="closeSettings" style="background-color: #f1f3f4; color: #202124; border: 1px solid #dadce0; padding: 10px 20px; border-radius: 4px; cursor: pointer;">${lang.close}</button>
            </div>
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

        const saveButton = document.getElementById('saveSettings');
        const closeButton = document.getElementById('closeSettings');

        saveButton.addEventListener('mouseover', () => {
            saveButton.style.backgroundColor = '#1967d2';
        });
        saveButton.addEventListener('mouseout', () => {
            saveButton.style.backgroundColor = '#1a73e8';
        });

        closeButton.addEventListener('mouseover', () => {
            closeButton.style.backgroundColor = '#e8eaed';
        });
        closeButton.addEventListener('mouseout', () => {
            closeButton.style.backgroundColor = '#f1f3f4';
        });

        document.getElementById('saveSettings').addEventListener('click', () => {
            config.columnLayout = parseInt(document.getElementById('columnLayout').value);
            config.autoPagingEnabled = document.getElementById('autoPaging').checked;
            config.bibtexCopyEnabled = document.getElementById('bibtexCopy').checked;
            config.bibtexCopyAlert = document.getElementById('bibtexCopyAlert').checked;
            config.singleResultRedirect = document.getElementById('singleResultRedirect').checked;
            config.showFrequentScholars = document.getElementById('showFrequentScholars').checked;
            GM_setValue('columnLayout', config.columnLayout);
            GM_setValue('autoPagingEnabled', config.autoPagingEnabled);
            GM_setValue('bibtexCopyEnabled', config.bibtexCopyEnabled);
            GM_setValue('bibtexCopyAlert', config.bibtexCopyAlert);
            GM_setValue('singleResultRedirect', config.singleResultRedirect);
            GM_setValue('showFrequentScholars', config.showFrequentScholars);
            addStyles();
            if (config.autoPagingEnabled) {
                initAutoPaging();
            }
            if (config.bibtexCopyEnabled) {
                initBibtexCopy();
            }
            if (config.showFrequentScholars) {
                showFrequentScholars();
            } else {
                removeFrequentScholars();
            }
            const newLanguage = document.querySelector('input[name="language"]:checked').value;
            if (newLanguage !== config.language) {
                config.language = newLanguage;
                GM_setValue('language', config.language);
                updateUILanguage();
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

                if (config.showFrequentScholars) {
                    showFrequentScholars(); // Update frequent scholars after loading more results
                }

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

    function redirectSingleResult() {
        if (!config.singleResultRedirect) return;
        const links = document.querySelectorAll('.gs_rt > a');
        if (links.length !== 1) return;
        if (sessionStorage.getItem(location.href) === null) {
            // Prevent redirection when back button is pressed
            sessionStorage.setItem(location.href, '1');
            links[0].click();
        }
    }

    function showFrequentScholars() {
        const scholarCounts = {};
        const scholarInfo = {};
        const results = document.querySelectorAll('.gs_r.gs_or.gs_scl');
        
        results.forEach(result => {
            const authors = result.querySelectorAll('.gs_a a');
            authors.forEach(author => {
                const name = author.textContent.trim();
                const link = author.href;
                if (link.includes('user=')) {  // Ensure it's a Google Scholar profile link
                    if (link in scholarCounts) {
                        scholarCounts[link]++;
                    } else {
                        scholarCounts[link] = 1;
                        scholarInfo[link] = { name, link };
                    }
                }
            });
        });

        const sortedScholars = Object.entries(scholarCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Show top 10 frequent scholars

        const lang = translations[config.language];
        const frequentScholarsDiv = document.createElement('div');
        frequentScholarsDiv.id = 'frequent-scholars';
        frequentScholarsDiv.style.cssText = `
            position: fixed;
            right: 20px;
            top: 200px;
            background-color: white;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            max-width: 250px;
            z-index: 1000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            font-size: 14px;
            line-height: 1.4;
        `;

        frequentScholarsDiv.innerHTML = `
            <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 16px;">${lang.showFrequentScholars}</h3>
            <ul style="list-style-type: none; padding-left: 0; margin: 0;">
                ${sortedScholars.map(([link, count]) => `
                    <li style="margin-bottom: 8px;">
                        <a href="${link}" target="_blank" style="text-decoration: none; color: #1a0dab; display: inline-block; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${scholarInfo[link].name}</a>
                        <span style="color: #006621; font-size: 12px;"> (${count})</span>
                    </li>
                `).join('')}
            </ul>
        `;

        document.body.appendChild(frequentScholarsDiv);
    }

    function removeFrequentScholars() {
        const frequentScholarsDiv = document.getElementById('frequent-scholars');
        if (frequentScholarsDiv) {
            frequentScholarsDiv.remove();
        }
    }

    function applyAdvancedSearch() {
        const mainSearchInput = document.querySelector('input[name="q"]');
        if (!mainSearchInput) return;

        let query = '';

        const allWords = document.getElementById('all-words').value;
        const exactPhrase = document.getElementById('exact-phrase').value;
        const withoutWords = document.getElementById('without-words').value;
        const author = document.getElementById('author').value;
        const publication = document.getElementById('publication').value;
        const titleOnly = document.getElementById('title-only').checked;

        if (titleOnly) {
            query += 'allintitle:';
        }

        if (allWords) query += allWords + ' ';
        if (exactPhrase) query += `"${exactPhrase}" `;
        if (withoutWords) query += '-' + withoutWords.split(' ').join(' -') + ' ';
        if (author) query += `author:"${author}" `;
        if (publication) query += `source:"${publication}" `;

        mainSearchInput.value = query.trim();
        
        // Store the current values in sessionStorage
        sessionStorage.setItem('gs_enhancer_all_words', allWords);
        sessionStorage.setItem('gs_enhancer_exact_phrase', exactPhrase);
        sessionStorage.setItem('gs_enhancer_without_words', withoutWords);
        sessionStorage.setItem('gs_enhancer_author', author);
        sessionStorage.setItem('gs_enhancer_publication', publication);
        sessionStorage.setItem('gs_enhancer_title_only', titleOnly);

        document.querySelector('button[type="submit"]').click();
    }

    function restoreAdvancedSearchValues() {
        document.getElementById('all-words').value = sessionStorage.getItem('gs_enhancer_all_words') || '';
        document.getElementById('exact-phrase').value = sessionStorage.getItem('gs_enhancer_exact_phrase') || '';
        document.getElementById('without-words').value = sessionStorage.getItem('gs_enhancer_without_words') || '';
        document.getElementById('author').value = sessionStorage.getItem('gs_enhancer_author') || '';
        document.getElementById('publication').value = sessionStorage.getItem('gs_enhancer_publication') || '';
        document.getElementById('title-only').checked = sessionStorage.getItem('gs_enhancer_title_only') === 'true';
    }

    function switchLanguage() {
        config.language = config.language === 'en' ? 'zh' : 'en';
        GM_setValue('language', config.language);
        updateUILanguage();
    }

    function updateUILanguage() {
        const lang = translations[config.language];
        document.getElementById('settings-button').textContent = lang.settings;
        
        const advancedSearchFields = [
            { id: 'all-words', labelKey: 'keywords', placeholderKey: 'allOfTheWords' },
            { id: 'exact-phrase', labelKey: 'exactPhrase' },
            { id: 'without-words', labelKey: 'without', placeholderKey: 'withoutWords' },
            { id: 'author', labelKey: 'author' },
            { id: 'publication', labelKey: 'publishedIn', placeholderKey: 'journalOrConference' }
        ];

        advancedSearchFields.forEach(field => {
            const label = document.querySelector(`label[for="${field.id}"]`);
            if (label) {
                label.textContent = lang[field.labelKey] + ':';
            }
            
            const input = document.getElementById(field.id);
            if (input) {
                if (field.placeholderKey) {
                    input.placeholder = lang[field.placeholderKey];
                }
                input.title = lang[field.labelKey]; // Add tooltip
            }
        });

        const titleOnlyLabel = document.querySelector('label[for="title-only"]');
        if (titleOnlyLabel) {
            titleOnlyLabel.lastChild.textContent = lang.titleOnly;
        }

        document.getElementById('apply-button').textContent = lang.apply;

        // Update frequent scholars title if it exists
        const frequentScholarsTitle = document.querySelector('#frequent-scholars h3');
        if (frequentScholarsTitle) {
            frequentScholarsTitle.textContent = lang.showFrequentScholars;
        }
    }

    function init() {
        if (document.querySelector('#gs_top')) {
            addStyles();
            createSettingsButton();
            updateUILanguage(); // This line is important
            restoreAdvancedSearchValues();
            if (config.autoPagingEnabled) {
                initAutoPaging();
            }
            initBibtexCopy();
            redirectSingleResult();
            if (config.showFrequentScholars) {
                showFrequentScholars();
            }
        }
    }

    // Run the script
    init();
})();