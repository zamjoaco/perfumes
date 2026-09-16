import { TestBed } from '@angular/core/testing';
import { ProductResponse } from '../products/models';
import { CartService, toCents } from './cart.service';

function product(id: number, salePrice: number, currentStock = 10): ProductResponse {
  return {
    id, sku: `P${id}`, brandId: 1, brand: 'Dior', name: `Producto ${id}`, concentration: 'EDP', presentation: 'BOTTLE',
    sizeMl: 100, gender: null, fragranceFamily: null, costPrice: 1, salePrice, currentStock, minStock: 1,
    belowMinimum: false, active: true,
  };
}

describe('toCents', () => {
  it('redondea a centavos enteros sin errores de float', () => {
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(89999.99)).toBe(8999999);
    expect(toCents('1234,56')).toBe(123456);
    expect(toCents('abc')).toBe(0);
  });
});

describe('CartService', () => {
  let cart: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    cart = TestBed.inject(CartService);
    cart.clear();
  });

  it('suma en centavos: tres de 0.10 son exactamente 0.30', () => {
    const p = product(1, 0.1);
    cart.add(p);
    cart.add(p);
    cart.add(p);
    expect(cart.lines()[0].quantity).toBe(3);
    expect(cart.subtotalCents()).toBe(30);
    expect(cart.totalCents()).toBe(30);
  });

  it('no pasa del stock disponible al agregar', () => {
    const p = product(1, 100, 2);
    cart.add(p);
    cart.add(p);
    cart.add(p);
    expect(cart.lines()[0].quantity).toBe(2);
  });

  it('un producto sin stock no entra al carrito', () => {
    cart.add(product(1, 100, 0));
    expect(cart.isEmpty()).toBe(true);
  });

  it('descuento en centavos y total nunca negativo', () => {
    cart.add(product(1, 89999.99));
    cart.setDiscount('999.99');
    expect(cart.subtotalCents()).toBe(8999999);
    expect(cart.totalCents()).toBe(8900000);
    expect(cart.discountExceedsSubtotal()).toBe(false);

    cart.setDiscount(100000);
    expect(cart.totalCents()).toBe(0);
    expect(cart.discountExceedsSubtotal()).toBe(true);

    cart.setDiscount(-5);
    expect(cart.discountCents()).toBe(0);
  });

  it('arma el request sin total y con el descuento como string de 2 decimales', () => {
    cart.add(product(1, 100));
    cart.add(product(2, 50));
    cart.setQuantity(2, 3);
    cart.setDiscount(10.5);

    const req = cart.toRequest('MP', '  regalo ');
    expect(req).toEqual({
      items: [
        { productId: 1, quantity: 1 },
        { productId: 2, quantity: 3 },
      ],
      paymentMethod: 'MP',
      discount: '10.50',
      notes: 'regalo',
      soldAt: null,
    });
    expect('total' in req).toBe(false);
  });

  it('remove y clear', () => {
    cart.add(product(1, 100));
    cart.add(product(2, 50));
    cart.remove(1);
    expect(cart.lines().map((l) => l.product.id)).toEqual([2]);
    cart.clear();
    expect(cart.isEmpty()).toBe(true);
    expect(cart.discountCents()).toBe(0);
  });
});
