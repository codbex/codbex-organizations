const navigationData = {
    id: 'organizations-navigation',
    label: "Organizations",
    view: "organizations",
    group: "organizations",
    orderNumber: 1000,
    lazyLoad: true,
    link: "/services/web/codbex-organizations/gen/codbex-organizations/ui/Organizations/index.html?embedded"
};

function getNavigation() {
    return navigationData;
}

if (typeof exports !== 'undefined') {
    exports.getNavigation = getNavigation;
}

export { getNavigation }