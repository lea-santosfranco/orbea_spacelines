import { Link } from 'react-router';
import { Heart } from 'lucide-react';
import ProductCard from '../../components/products/ProductCard.jsx';
import { useFavorites } from '../../context/useFavorites.js';

function FavoritesPage() {
  const { products, isLoading } = useFavorites();

  return (
    <section aria-labelledby="titre-favoris">
      <title>Mes favoris · Orbea Spacelines</title>
      <h1 id="titre-favoris" className="font-display text-[32px] font-extrabold leading-[1.1]">
        Mes favoris
      </h1>

      {isLoading && (
        <p role="status" className="mt-8 text-brume">
          Chargement de vos favoris…
        </p>
      )}

      {!isLoading && products.length === 0 && (
        <div className="mt-8 rounded-carte border border-trait p-10 text-center">
          <Heart aria-hidden="true" strokeWidth={1.5} className="mx-auto size-10 text-aube" />
          <p className="mt-4 font-display text-[22px] font-bold">Aucun favori pour le moment</p>
          <p className="mt-2 text-brume">Cliquez sur le cœur d'un voyage ou d'un article pour le retrouver ici.</p>
          <Link to="/destinations" className="mt-6 inline-block font-bold text-ciel underline">
            Découvrir les destinations
          </Link>
        </div>
      )}

      {!isLoading && products.length > 0 && (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <li key={product.id} className="flex">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default FavoritesPage;
