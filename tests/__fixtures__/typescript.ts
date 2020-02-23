/* resk start "schema" */
const typeDefs = `
  type Query {
    frontPage: [Fruit!]!
    fruits: [Fruit!]!
    customers: [Customer!]!
  }
  type Mutation {
    addFruitToBasket: Boolean!
  }
  type Fruit {
    name: String!
    count: Int!
  }
  type Customer {
    id: ID!
    basket: [Fruit!]!
  }
`
/* resk end */

const resolvers = {
  Query: {
    frontPage: () => [
      { name: 'orange', count: 10 },
      { name: 'apple', count: 1 },
    ],
    fruits: () => {
      /* resk start "fruits" */
      const fruits = [
        { name: 'orange', count: 10 },
        { name: 'apple', count: 1 },
        { name: 'strawberries', count: 100 },
      ]
      /* resk end */

      return fruits
    },
    customers: () => [
      { id: 1, basket: [{ name: 'orange', count: 1 }] },
      { id: 2, basket: [{ name: 'apple', count: 2 }] },
    ],
  },
  Mutation: {
    addFruitToBasket: () => true,
  },
}

// Auth
/* resk start "users" */
const users = {
  mathew: {
    id: 1,
    name: 'Mathew',
    role: 'admin',
  },
  george: {
    id: 2,
    name: 'George',
    role: 'editor',
  },
  johnny: {
    id: 3,
    name: 'Johnny',
    role: 'customer',
  },
}
/* resk end */

function getUser(req) {
  const auth = req.get('Authorization')
  if (users[auth]) {
    return users[auth]
  } else {
    return null
  }
}
