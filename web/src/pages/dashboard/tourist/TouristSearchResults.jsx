import CatalogSearchResultsView from '../../../components/public/catalog/CatalogSearchResultsView.jsx'
import { touristExploreHref, touristHomeHref } from '../../../components/layout/tourist/touristLayout.constants.js'

const TouristSearchResults = () => (
  <CatalogSearchResultsView
    backLink={{ href: touristExploreHref, label: 'Back to Explore' }}
    cornerLink={{ href: touristHomeHref, label: 'Home hub' }}
    searchInputName="tourist-search-results"
    emptyQueryHint="Add a search from the home hero to see matching menu items and packages here, or go back to Explore."
    noResultsHint="No catalog items matched that search. Try different keywords or browse Explore by category."
  />
)

export default TouristSearchResults
