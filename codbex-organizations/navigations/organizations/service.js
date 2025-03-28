const navigationData = {
    id: 'organizations-navigation',
    label: "Organizations",
    group: "company",
    order: 200,
    link: "/services/web/codbex-organizations/gen/codbex-organizations/ui/Organizations/index.html?embedded"
};

function getNavigation() {
    return navigationData;
}

if (typeof exports !== 'undefined') {
    exports.getNavigation = getNavigation;
}

export { getNavigation }
