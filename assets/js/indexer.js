window.addEventListener("load", () => { load(); });
const specialTags = {
    "categories": "data-store-categories",
    "owner": "data-repo-owner",
    "slug": "data-repo-slug",
    "omitted": "data-omitted-keys"
};

async function load() {
    let metaTags = document.getElementsByTagName("meta");
    let repoOwner = null;
    let repoSlug = null;
    let omitted = [];
    let categories = [];

    for (let i = 0; i < metaTags.length; i++) {
        let tag = metaTags[i];

        if (tag.hasAttribute(specialTags.categories)) {
            let categoriesTag = tag.getAttribute(specialTags.categories);
            let split = categoriesTag.split(",");

            for (let j = 0; j < split.length; j++) {
                categories.push(split[j].trim().toLowerCase());
            }
        }

        if (tag.hasAttribute(specialTags.owner)) {
            let ownerTag = tag.getAttribute(specialTags.owner);
            repoOwner = ownerTag.trim();
        }

        if (tag.hasAttribute(specialTags.slug)) {
            let slugTag = tag.getAttribute(specialTags.slug);
            repoSlug = slugTag.trim();
        }

        if (tag.hasAttribute(specialTags.omitted)) {
            let omittedTag = tag.getAttribute(specialTags.omitted);
            let split = omittedTag.split(",");

            for (let j = 0; j < split.length; j++) {
                omitted.push(split[j].trim().toLowerCase());
            }
        }
    }

    for (let o = 0; o < categories.length; o++) {
        let category = categories[o];

        await getJson(getUrlFor(repoOwner, repoSlug, category))
            .then(async (data) => {
                ensureExists(category);
                await processData(category, data, omitted);
            })
            .catch(err => {
                ensureRemoved(category);
                console.log(err)
            });
    }
}

function ensureRemoved(category) {
    let storeTabs = document.getElementById("storeTabs");
    let categoryTab = document.getElementById(`${category}Tab`);

    if (categoryTab !== null) {
        storeTabs.removeChild(categoryTab);
    }

    let storePanes = document.getElementById(`storePanes`);
    let categoryPane = document.getElementById(`${category}Pane`);

    if (categoryPane !== null) {
        storePanes.removeChild(categoryPane);
    }
}

function ensureExists(category) {
    ensurePaneExists(category);
    ensureTabExists(category);
}

function ensurePaneExists(category) {
    let storePanes = document.getElementById("storePanes");

    if (storePanes === null) {
        storePanes = document.createElement("div");
        storePanes.id = "storePanes";
        storePanes.classList.add("tab-content");
        document.body.append(storePanes);
    }

    let pane = document.getElementById(`${category}Pane`);

    if (pane === null) {
        pane = document.createElement("div");
        pane.id = `${category}Pane`;
        pane.classList.add("tab-pane");
        pane.classList.add("fade");

        if (storePanes.children.length <= 0) {
            pane.classList.add("show");
            pane.classList.add("active");
        }

        pane.setAttribute("role", "tabpanel");
        pane.setAttribute("aria-labelledby", `${category}Tab`);
        storePanes.append(pane);
    }
}

function ensureTabExists(category) {
    let storeTabs = document.getElementById("storeTabs");

    if (storeTabs === null) {
        storeTabs = document.createElement("ul");
        storeTabs.id = "storeTabs";
        storeTabs.classList.add("nav");
        storeTabs.classList.add("nav-tabs");
        document.body.append(storeTabs);
    }

    let tab = document.getElementById(`${category}Tab`);

    if (tab === null) {
        tab = document.createElement("li");
        tab.classList.add("nav-item");
        tab.setAttribute("role", "tablist");
        storeTabs.append(tab);
    }

    if (tab.children.length <= 0) {
        let button = document.createElement("button");
        button.classList.add("nav-link");
        button.id = `${category}-tab`;
        button.setAttribute("data-bs-toggle", "tab");
        button.setAttribute("data-bs-target", `#${category}Pane`);
        button.setAttribute("type", "button");
        button.setAttribute("role", "tab");
        button.setAttribute("aria-controls", category.toLowerCase());
        button.setAttribute("aria-selected", storeTabs.children.length > 0 ? "false" : "true");
        button.innerText = category.substring(0, 1).toUpperCase() + category.substring(1, category.length).toLowerCase();
        tab.append(button);
    }
}

function getUrlFor(owner, slug, category) {
    return `https://raw.githubusercontent.com/${owner}/${slug}/master/_data/${category}.json`;
}

async function getJson(url) {
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            return response.json();
        });
}

async function processData(category, data, omitted) {
    switch (category) {
        case "items":
            return await processDataInternal(category, data.items, omitted);
        case "events":
            return await processDataInternal(category, data.incitems, omitted);
        case "traits":
            if (data.traits !== undefined) {
                return await processDataInternal(category, data.traits, omitted);
            } else {
                return await processDataInternal(category, data, omitted);
            }
        case "pawns":
            if (data.races !== undefined) {
                return await processDataInternal(category, data.races, omitted);
            } else {
                return await processDataInternal(category, data, omitted);
            }
        default:
            return await processDataInternal(category, data, omitted);
    }
}

async function processDataInternal(category, data, omitted) {
    if (data === undefined || data === null) {
        return new TypeError("The data provided was malformed.");
    }

    let itemsPane = document.getElementById(`${category}Pane`);

    if (itemsPane.children.length > 0) {
        let kids = [];

        for (let y = 0; y < itemsPane.children.length; y++) {
            kids.push(itemsPane.children[y]);
        }

        for (let y = 0; y < kids.length; y++) {
            itemsPane.removeChild(kids[y]);
        }

        kids = [];
    }

    let container = document.createElement("div");
    container.classList.add("table-responsive");
    container.classList.add("text-wrap");
    let table = document.createElement("table");
    table.classList.add("table");
    table.classList.add("table-striped");
    table.classList.add("table-hover");
    table.classList.add("table-borderless");
    // table.classList.add("align-middle");
    let tableHeader = document.createElement("thead");
    let headerRow = document.createElement("tr");
    let tableBody = document.createElement("tbody")

    if (data.length > 0) {
        let anItem = data[0];
        let keys = [];
        let _keys = Object.keys(anItem).sort();

        for (let a = 0; a < _keys.length; a++) {
            let key = _keys[a];

            if (omitted.includes(key)) {
                continue;
            }

            keys.push(key);
        }

        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];

            let header = document.createElement("th");
            header.classList.add("col");
            header.innerText = key.substring(0, 1).toUpperCase() + key.substring(1, key.length).toLowerCase();
            headerRow.append(header);
        }

        tableHeader.append(headerRow);

        for (let j = 0; j < data.length; j++) {
            let item = data[j];
            let row = document.createElement("tr");

            for (let l = 0; l < keys.length; l++) {
                let cell = document.createElement("td");
                cell.innerText = item[keys[l]];
                cell.classList.add("user-select-all");
                row.append(cell);
            }

            tableBody.append(row);
        }

        table.append(tableHeader);
        table.append(tableBody);
        container.append(table);
    }

    itemsPane.append(container);
}
