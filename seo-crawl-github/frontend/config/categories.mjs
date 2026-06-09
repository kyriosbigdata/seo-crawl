export const dashboardCategories = [
    {
    id: 'total',
    label: 'Total',
    dataBasePath: '../data/dashboard/total',
    isDefault: true
},
    {
        id: 'belleza-cuidado-piel',
        label: 'Belleza y Cuidado de la Piel',
        dataBasePath: '../data/dashboard/Belleza y Cuidado de la Piel',
        isDefault: true
    },
    {
        id: 'cuidado-infantil',
        label: 'Cuidado Infantil',
        dataBasePath: '../data/dashboard/Cuidado Infantil'
    },
    {
        id: 'cuidado-personal',
        label: 'Cuidado Personal',
        dataBasePath: '../data/dashboard/Cuidado Personal'
    },
    {
        id: 'cuidado-sexual',
        label: 'Cuidado Sexual',
        dataBasePath: '../data/dashboard/Cuidado Sexual'
    },
    {
        id: 'equipos-accesorios-salud',
        label: 'Equipos y Accesorios de Salud',
        dataBasePath: '../data/dashboard/Equipos y Accesorios de Salud'
    },
    {
        id: 'hogar',
        label: 'Hogar',
        dataBasePath: '../data/dashboard/Hogar'
    },
    {
        id: 'marca',
        label: 'Marca',
        dataBasePath: '../data/dashboard/Marca'
    },
    {
        id: 'medicinas',
        label: 'Medicinas',
        dataBasePath: '../data/dashboard/Medicinas'
    },
    {
        id: 'minimarket',
        label: 'Minimarket',
        dataBasePath: '../data/dashboard/Minimarket'
    },
    {
        id: 'nutricion-fitness',
        label: 'Nutrición y Fitness',
        dataBasePath: '../data/dashboard/Nutrición y Fitness'
    },
    {
        id: 'tratamientos-salud',
        label: 'Tratamientos y Salud',
        dataBasePath: '../data/dashboard/Tratamientos y Salud'
    },
    {
        id: 'vitaminas-suplementos',
        label: 'Vitaminas y Suplementos',
        dataBasePath: '../data/dashboard/Vitaminas y Suplementos'
    }
];

export function getDefaultCategory() {
    return dashboardCategories.find(category => category.isDefault) || dashboardCategories[0];
}

export function getCategoryById(categoryId) {
    return dashboardCategories.find(category => category.id === categoryId) || getDefaultCategory();
}
