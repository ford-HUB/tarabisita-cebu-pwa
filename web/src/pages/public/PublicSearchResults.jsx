import CatalogSearchResultsView from '../../components/public/catalog/CatalogSearchResultsView.jsx'

const PublicSearchResults = () => (
  <CatalogSearchResultsView
    backLink={{ href: '/', label: 'Back to home' }}
    cornerLink={{ href: '/register', label: 'Create account' }}
    guestCatalog
    guestCart
    searchInputName="public-search-results"
    emptyQueryHint="Search from the home page hero to see matching menu items and packages here."
    noQueryHint="Type a keyword above and press Explore, or use trending chips — results come from dishes and stay packages in our catalog."
    noResultsHint="No catalog items matched that search. Try different keywords or browse partners on the home page."
  />
)

export default PublicSearchResults
