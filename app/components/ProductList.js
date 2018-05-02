import React from 'react';

export default function ProductList({products = []}) {
  const productItems = products.map(({title, id}) => (
    <li key={`${id}`}>
      {title}
    </li>
  ));

  return (
    <ul>
      {productItems}
    </ul>
  );
}
