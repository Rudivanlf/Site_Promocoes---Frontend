export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  sales: number;
  image: string;
  link?: string;
  category: string;
}

export const mockProducts: Product[] = [
  {
    id: 1,
    name: "Mesa de Madeira",
    price: 450.00,
    description: "Mesa de madeira com acabamento refinado e design moderno.",
    sales: 250,
    image: "/src/assets/MesaDeMadeira.jpg",
    category: "Móveis"
  },
  {
    id: 2,
    name: "Cadeira de Madeira",
    price: 150.00,
    description: "Cadeira ergonômica de madeira com apoio para costas e ajuste de altura.",
    sales: 300,
    image: "/src/assets/CadeiraDeMadeira.jpg",
    category: "Móveis"
  },
  {
    id: 3,
    name: "Enfeite de Mesa",
    price: 350.00,
    description: "Enfeite de mesa feito de madeira, ideal para decoração de ambientes internos.",
    sales: 180,
    image: "/src/assets/EnfeiteDeMesa.jpg",
    category: "Decoração"
  },
  {
    id: 4,
    name: "Tábuas de Madeira de 4x4",
    price: 1200.00,
    description: "Tábuas de madeira para construção, com alta resistência e durabilidade.",
    sales: 95,
    image: "/src/assets/Tábua.jpg",
    category: "Construção"
  },
];