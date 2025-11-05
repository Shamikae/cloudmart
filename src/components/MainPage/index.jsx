import React, { useState, useEffect } from "react";
import { Search, MessageCircle } from "lucide-react";
import Header from "../Header";
import Footer from "../Footer";
import LoadingSpinner from "../LoadingSpinner";
import { addToCart } from "../../utils/cartUtils";
import api from "../../config/axiosConfig";
import AIAssistant from "../AIAssistant";

const FALLBACK_IMAGE =
  "https://via.placeholder.com/300x200.png?text=CloudMart+Product";

const ProductCard = ({ product, onAddToCart }) => {
  const name = product.name || "Unnamed product";
  const description = product.description || "No description provided.";
  const price = Number(product.price) || 0;

  const truncatedTitle =
    name.length > 60 ? name.slice(0, 60) + "..." : name;

  const truncatedDescription =
    description.length > 195
      ? description.slice(0, 195) + "..."
      : description;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex flex-col justify-between h-full">
      <div>
        <img
          src={product.image || FALLBACK_IMAGE}
          alt={name}
          className="w-full h-48 object-contain mb-4"
        />
        <h3
          className="text-lg font-semibold overflow-hidden"
          title={name}
        >
          {truncatedTitle}
        </h3>

        <h3
          className="text-md overflow-hidden mb-2"
          title={description}
        >
          {truncatedDescription}
        </h3>
      </div>
      <div>
        <p className="text-gray-600">${price.toFixed(2)}</p>
        <button
          onClick={() => onAddToCart(product)}
          className="mt-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors w-full"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

const CloudMartMainPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products");
        let data = response.data;

        if (typeof data === "string") {
          try {
            data = JSON.parse(data);
          } catch (parseError) {
            throw new Error("Received products payload is not valid JSON.");
          }
        }

        if (!Array.isArray(data)) {
          throw new Error("Products payload is not an array.");
        }

        const normalizedProducts = data.map((product, index) => {
          const name = product?.name || `Product ${index + 1}`;
          const description = product?.description || "No description provided.";
          const price = Number(product?.price) || 0;
          const id = product?.id || `${name}-${index}`;

          return {
            ...product,
            id,
            name,
            description,
            price,
            image: product?.image || FALLBACK_IMAGE,
          };
        });

        setProducts(normalizedProducts);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch products. Please try again later.");
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (product) => {
    addToCart(product);
    // You might want to update the cart count in the header here
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredProducts = products.filter((product) =>
    (product.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <main className="container mx-auto py-8 flex-grow px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={handleSearch}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <p className="text-center text-red-500 mt-6">{error}</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-center text-gray-500 mt-6">
            No products found matching your search.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
      <AIAssistant />
    </div>
  );
};

export default CloudMartMainPage;
