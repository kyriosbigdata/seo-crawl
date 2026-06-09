export function renderSidebarNav({
    containerId = 'sidebarNav',
    categories = [],
    activeCategoryId = null,
    onCategoryChange = null
}) {
    const container = document.getElementById(containerId);

    if (!container) return;

    container.innerHTML = categories.map(category => {
        const isActive = category.id === activeCategoryId;

        return `
            <button
                type="button"
                class="sidebar-nav-btn ${isActive ? 'active' : ''}"
                data-category-id="${category.id}"
            >
                ${category.label}
            </button>
        `;
    }).join('');

    const buttons = Array.from(container.querySelectorAll('.sidebar-nav-btn'));

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const categoryId = button.dataset.categoryId;

            if (typeof onCategoryChange === 'function') {
                onCategoryChange(categoryId);
            }
        });
    });
}