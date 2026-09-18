(() => {
    "use strict";

    const LANGUAGE_KEY = "samYogLanguage";

    const LANGUAGES = {
        en: "English",
        hi: "Hindi",
        sat: "Santali"
    };

    let isTranslating = false;

    // =========================================================
    // LANGUAGE
    // =========================================================

    function getLanguage() {
        return localStorage.getItem(LANGUAGE_KEY) || "en";
    }

    async function setLanguage(language) {

        console.log("=================================");
        console.log("Changing language to:", language);
        console.log("=================================");

        if (!LANGUAGES[language]) {
            console.error("Unsupported language:", language);
            return;
        }

        localStorage.setItem(LANGUAGE_KEY, language);

        if (language === "en") {
            restoreEnglish();
            return;
        }

        await translatePage(language);
    }


    // =========================================================
    // FIND TEXT
    // =========================================================

    function getTextNodes() {

        const nodes = [];

        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT
        );

        let node;

        while ((node = walker.nextNode())) {

            if (!node.parentElement) continue;

            const tag = node.parentElement.tagName;

            // Ignore code / scripts / styles
            if (
                tag === "SCRIPT" ||
                tag === "STYLE" ||
                tag === "NOSCRIPT" ||
                tag === "CODE" ||
                tag === "PRE"
            ) {
                continue;
            }

            // Ignore language selector
            if (
                node.parentElement.closest(
                    "#samYogLanguageWrapper"
                )
            ) {
                continue;
            }

            const text = node.nodeValue.trim();

            if (!text) continue;

            if (text.length < 2) continue;

            nodes.push(node);
        }

        return nodes;
    }


    // =========================================================
    // SAVE ORIGINAL ENGLISH
    // =========================================================

    function saveOriginal(node) {

        if (!node) return;

        if (node._samyogOriginal === undefined) {

            node._samyogOriginal =
                node.nodeValue;
        }
    }


    // =========================================================
    // RESTORE ENGLISH
    // =========================================================

    function restoreEnglish() {

        console.log(
            "Restoring English..."
        );

        const nodes = getTextNodes();

        nodes.forEach(node => {

            if (
                node._samyogOriginal !== undefined
            ) {

                node.nodeValue =
                    node._samyogOriginal;
            }
        });

        console.log(
            "English restored."
        );
    }


    // =========================================================
    // CACHE
    // =========================================================

    function getCache(language) {

        try {

            return JSON.parse(
                localStorage.getItem(
                    `samyog_${language}`
                ) || "{}"
            );

        } catch {

            return {};
        }
    }


    function saveCache(language, cache) {

        localStorage.setItem(
            `samyog_${language}`,
            JSON.stringify(cache)
        );
    }


    // =========================================================
    // TRANSLATE PAGE
    // =========================================================

    async function translatePage(language) {

        if (isTranslating) {

            console.log(
                "Translation already running."
            );

            return;
        }

        isTranslating = true;

        try {

            const nodes =
                getTextNodes();

            console.log(
                "Text nodes found:",
                nodes.length
            );


            // Save original English
            nodes.forEach(saveOriginal);


            const cache =
                getCache(language);


            const texts = [];


            nodes.forEach(node => {

                const original =
                    node._samyogOriginal;

                if (!original) return;

                const clean =
                    original.trim();

                if (
                    !cache[clean] &&
                    !texts.includes(clean)
                ) {

                    texts.push(clean);
                }

            });


            console.log(
                "Texts requiring translation:",
                texts.length
            );


            // =================================================
            // REQUEST TRANSLATIONS
            // =================================================

            if (texts.length > 0) {

                const batchSize = 15;

                for (
                    let i = 0;
                    i < texts.length;
                    i += batchSize
                ) {

                    const batch =
                        texts.slice(
                            i,
                            i + batchSize
                        );

                    console.log(
                        "Sending translation request:",
                        batch
                    );


                    const response =
                        await fetch(
                            "/api/translate",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify({

                                    texts: batch,

                                    targetLanguage:
                                        language

                                })
                            }
                        );


                    console.log(
                        "API status:",
                        response.status
                    );


                    const result =
                        await response.json();


                    console.log(
                        "API result:",
                        result
                    );


                    if (!response.ok) {

                        throw new Error(
                            result.error ||
                            "Translation API failed"
                        );
                    }


                    if (
                        !result.success ||
                        !Array.isArray(
                            result.translations
                        )
                    ) {

                        throw new Error(
                            "Invalid translation response"
                        );
                    }


                    batch.forEach(
                        (text, index) => {

                            cache[text] =
                                result.translations[
                                    index
                                ];
                        }
                    );


                    saveCache(
                        language,
                        cache
                    );
                }
            }


            // =================================================
            // APPLY TRANSLATIONS
            // =================================================

            nodes.forEach(node => {

                const original =
                    node._samyogOriginal;

                if (!original) return;

                const clean =
                    original.trim();


                const translated =
                    cache[clean];


                if (translated) {

                    const leading =
                        original.match(
                            /^\s*/
                        )?.[0] || "";


                    const trailing =
                        original.match(
                            /\s*$/
                        )?.[0] || "";


                    node.nodeValue =
                        leading +
                        translated +
                        trailing;
                }

            });


            console.log(
                "================================="
            );

            console.log(
                "TRANSLATION COMPLETE:",
                language
            );

            console.log(
                "================================="
            );


        } catch (error) {

            console.error(
                "TRANSLATION FAILED:",
                error
            );

            alert(
                "Translation failed.\n\n" +
                error.message
            );

        } finally {

            isTranslating = false;
        }
    }


    // =========================================================
    // LANGUAGE SELECTOR
    // =========================================================

    function createLanguageSelector() {

        if (
            document.getElementById(
                "samYogLanguageWrapper"
            )
        ) {
            return;
        }


        const wrapper =
            document.createElement("div");


        wrapper.id =
            "samYogLanguageWrapper";


        wrapper.style.position =
            "fixed";

        wrapper.style.top =
            "20px";

        wrapper.style.right =
            "25px";

        wrapper.style.zIndex =
            "99999";

        wrapper.style.display =
            "flex";

        wrapper.style.alignItems =
            "center";

        wrapper.style.gap =
            "8px";


        wrapper.innerHTML = `

            <label
                for="samYogLanguage"
                style="
                    font-family:Arial;
                    font-size:14px;
                    font-weight:600;
                "
            >
                Language
            </label>


            <select
                id="samYogLanguage"
                style="
                    padding:8px 12px;
                    border-radius:8px;
                    border:1px solid #aaa;
                    background:white;
                    cursor:pointer;
                    font-size:14px;
                "
            >

                <option value="en">
                    English
                </option>

                <option value="hi">
                    हिन्दी
                </option>

                <option value="sat">
                    ᱥᱟᱱᱛᱟᱲᱤ
                </option>

            </select>
        `;


        document.body.appendChild(
            wrapper
        );


        const selector =
            document.getElementById(
                "samYogLanguage"
            );


        selector.value =
            getLanguage();


        selector.addEventListener(
            "change",
            async () => {

                await setLanguage(
                    selector.value
                );

            }
        );
    }


    // =========================================================
    // START
    // =========================================================

   function init() {

    console.log("=================================");
    console.log("SAMYOG TRANSLATOR LOADED");

    const language = getLanguage();

    console.log("Saved language:", language);

    console.log("=================================");

    // Show language selector ONLY on index.html
    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    if (
        currentPage === "index.html" ||
        currentPage === ""
    ) {
        createLanguageSelector();
    }

    // Automatically translate every page
    // using the language selected on index.html
    if (language !== "en") {

        setTimeout(() => {
            translatePage(language);
        }, 500);
    }
}

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();
    }


    // =========================================================
    // PUBLIC API
    // =========================================================

    window.SamyogLanguage = {

        getLanguage,

        setLanguage,

        refresh: () => {

            const language =
                getLanguage();

            if (
                language === "en"
            ) {

                restoreEnglish();

            } else {

                translatePage(
                    language
                );
            }
        }

    };

})();