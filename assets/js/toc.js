(function () {
    const tocRoot = document.getElementById("post-toc");
    const tocList = tocRoot && tocRoot.querySelector(".toc-list");
    const postContent = document.getElementById("post-content");
    if (!tocRoot || !tocList || !postContent) return;

    const headings = postContent.querySelectorAll("h1, h2, h3, h4, h5, h6");
    if (!headings.length) {
        tocRoot.remove();
        return;
    }

    const usedIds = new Set();
    const slugify = (text) => {
        const slug = text.trim().toLowerCase().replace(/[^\p{L}\p{N}\- ]/gu, "").replace(/\s+/g, "-");
        let unique = slug;
        let i = 1;
        while (usedIds.has(unique)) {
            unique = `${slug}-${i++}`;
        }
        usedIds.add(unique);
        return unique;
    };

    const rootLevel = Math.min(...Array.from(headings).map((h) => Number(h.tagName[1])));
    const listStack = [{ level: rootLevel, el: tocList }];

    headings.forEach((heading) => {
        if (heading.id) {
            usedIds.add(heading.id);
        } else {
            heading.id = slugify(heading.textContent);
        }

        const level = Number(heading.tagName[1]);

        while (listStack.length > 1 && level < listStack[listStack.length - 1].level) {
            listStack.pop();
        }

        if (level > listStack[listStack.length - 1].level) {
            const parentLi = listStack[listStack.length - 1].el.lastElementChild;
            const sublist = document.createElement("ul");
            sublist.className = "toc-sublist";
            (parentLi || listStack[listStack.length - 1].el).appendChild(sublist);
            listStack.push({ level, el: sublist });
        }

        const li = document.createElement("li");
        li.className = "toc-item";
        const a = document.createElement("a");
        a.href = `#${heading.id}`;
        a.textContent = heading.textContent;
        li.appendChild(a);
        listStack[listStack.length - 1].el.appendChild(li);
    });
})();
