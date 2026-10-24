export const typeDefs = `#graphql
  type Message {
    id: ID!
    content: String!
    createdAt: String!
  }

  type Query {
    latestMessages(limit: Int): [Message]!
  }

  type Mutation {
    createMessage: Message!
  }
`;
