import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ProductCard from "../../components/ProductCard";

// Mock Next.js components
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const mockProduct = {
  id: "prod-1",
  name: "Test Chocolate Cake",
  description: "Delicious rich chocolate cake",
  price: 499,
  imageUrl: "https://example.com/image.jpg",
  categoryId: "cat-1",
  category: { name: "Cakes" },
};

const mockShop = {
  id: "shop-1",
  name: "Baker's Shop",
  vendor: {
    phone: "1234567890",
  },
};

describe("ProductCard Component", () => {
  it("renders product name and price correctly", () => {
    render(<ProductCard product={mockProduct} shop={mockShop} />);
    
    expect(screen.getByTestId("product-name")).toHaveTextContent("Test Chocolate Cake");
    expect(screen.getByTestId("product-price")).toHaveTextContent("₹499");
  });

  it("renders the shop name with link", () => {
    render(<ProductCard product={mockProduct} shop={mockShop} />);
    
    const shopLink = screen.getByText("Baker's Shop");
    expect(shopLink).toBeInTheDocument();
    expect(shopLink).toHaveAttribute("href", "/shop/shop-1");
  });

  it("renders the category badge", () => {
    render(<ProductCard product={mockProduct} shop={mockShop} />);
    
    expect(screen.getByText("Cakes")).toBeInTheDocument();
  });
});
