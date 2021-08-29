import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stockAmountProduct = await api.get(`/stock/${productId}`);

      if (cart.length > 0) {
        const productExists = cart.findIndex((index) => index.id === productId);
        if (cart[productExists]) {
          const productAmount = cart[productExists]
            ? cart[productExists].amount
            : 0;

          const newAmount = productAmount + 1;

          if (newAmount > stockAmountProduct.data.amount) {
            toast.error("Quantidade solicitada fora de estoque");
            return;
          }
          cart[productExists].amount = newAmount;
        } else {
          const res = await api.get(`/products/${productId}`);
          const newProduct = {
            ...res.data,
            amount: 1,
          };
          cart.push(newProduct);
        }
      } else {
        const res = await api.get(`/products/${productId}`);
        const newProduct = {
          ...res.data,
          amount: 1,
        };
        cart.push(newProduct);
      }
      setCart([...cart]);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
    } catch (error) {
      toast.error("Erro na adição do produto");
      return;
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const removeProduct = cart.findIndex((index) => index.id === productId);
      if (!cart[removeProduct]) {
        throw Error();
      }
      cart.splice(removeProduct, 1);
      setCart([...cart]);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
    } catch {
      toast.error("Erro na remoção do produto");
      return;
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stockAmountProduct = await api.get(`/stock/${productId}`);
      if (amount <= 0) {
        return;
      }
      if (amount > stockAmountProduct.data.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const productUpdate = cart.findIndex(
        (product) => product.id === productId
      );

      if (cart[productUpdate]) {
        cart[productUpdate].amount = amount;
        setCart([...cart]);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
      } else {
        throw Error();
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
      return;
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
