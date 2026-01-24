// utils/bp_docs.js

function openDocDrawer(docId) {
    const drawer = document.getElementById('infoDrawer');
    const overlay = document.getElementById('drawerOverlay');
    const contentArea = document.getElementById('drawerContent');

    // 1. Fetch content from our library (we'll build this next)
    const docData = docLibrary[docId];

    if (docData) {
        contentArea.innerHTML = docData.content;
        // Optional: Update a title at the top of the drawer
        document.getElementById('drawerTitle').innerText = docData.title || "Documentation";
    } else {
        contentArea.innerHTML = "<p>Documentation not found for this item.</p>";
    }

    // 2. Show Drawer
    drawer.classList.add('open');
    overlay.classList.add('open');
    
    // 3. Prevent background scrolling
    document.body.style.overflow = 'hidden';
}

function closeDocDrawer() {
    const drawer = document.getElementById('infoDrawer');
    const overlay = document.getElementById('drawerOverlay');

    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = 'auto';
}

// Event Listeners for Closing
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closeDrawer');
    const overlay = document.getElementById('drawerOverlay');

    if (closeBtn) closeBtn.onclick = closeDocDrawer;
    if (overlay) overlay.onclick = closeDocDrawer;
});