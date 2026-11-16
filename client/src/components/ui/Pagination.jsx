import { Link, useSearchParams } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aube';
const itemClass = `flex size-11 items-center justify-center rounded-full font-bold motion-safe:transition ${focusRing}`;

// Pagination par liens : chaque page a sa propre URL (partageable, et le bouton Retour fonctionne)
function Pagination({ page, totalPages }) {
  const [searchParams] = useSearchParams();

  if (totalPages <= 1) return null;

  function pageUrl(target) {
    const params = new URLSearchParams(searchParams);
    if (target === 1) params.delete('page');
    else params.set('page', String(target));
    const query = params.toString();
    return query ? `?${query}` : '?';
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label="Pagination" className="mt-12 flex justify-center">
      <ul className="flex items-center gap-2">
        <li>
          {page > 1 ? (
            <Link to={pageUrl(page - 1)} aria-label="Page précédente" className={`${itemClass} text-brume hover:bg-stratosphere-haute hover:text-neige`}>
              <ChevronLeft aria-hidden="true" strokeWidth={1.5} className="size-5" />
            </Link>
          ) : (
            <span aria-hidden="true" className={`${itemClass} text-trait`}>
              <ChevronLeft strokeWidth={1.5} className="size-5" />
            </span>
          )}
        </li>

        {pages.map((number) => (
          <li key={number}>
            <Link
              to={pageUrl(number)}
              aria-label={`Page ${number}`}
              aria-current={number === page ? 'page' : undefined}
              className={`${itemClass} ${
                number === page ? 'bg-aube text-abysse' : 'text-brume hover:bg-stratosphere-haute hover:text-neige'
              }`}
            >
              {number}
            </Link>
          </li>
        ))}

        <li>
          {page < totalPages ? (
            <Link to={pageUrl(page + 1)} aria-label="Page suivante" className={`${itemClass} text-brume hover:bg-stratosphere-haute hover:text-neige`}>
              <ChevronRight aria-hidden="true" strokeWidth={1.5} className="size-5" />
            </Link>
          ) : (
            <span aria-hidden="true" className={`${itemClass} text-trait`}>
              <ChevronRight strokeWidth={1.5} className="size-5" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}

export default Pagination;
