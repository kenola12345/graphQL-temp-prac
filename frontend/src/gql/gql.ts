/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query Me {\n    me {\n      id\n      email\n      name\n      role\n    }\n  }\n": typeof types.MeDocument,
    "\n  mutation Signup($input: SignupInput!) {\n    signup(input: $input) {\n      id\n      email\n      name\n      role\n    }\n  }\n": typeof types.SignupDocument,
    "\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      id\n      email\n      name\n      role\n    }\n  }\n": typeof types.LoginDocument,
    "\n  mutation Logout {\n    logout\n  }\n": typeof types.LogoutDocument,
    "\n  query Todos {\n    todos {\n      id\n      title\n      completed\n    }\n  }\n": typeof types.TodosDocument,
    "\n  mutation CreateTodo($input: CreateTodoInput!) {\n    createTodo(input: $input) {\n      id\n      title\n      completed\n    }\n  }\n": typeof types.CreateTodoDocument,
    "\n  mutation UpdateTodo($id: ID!, $input: UpdateTodoInput!) {\n    updateTodo(id: $id, input: $input) {\n      id\n      title\n      completed\n    }\n  }\n": typeof types.UpdateTodoDocument,
    "\n  mutation DeleteTodo($id: ID!) {\n    deleteTodo(id: $id)\n  }\n": typeof types.DeleteTodoDocument,
};
const documents: Documents = {
    "\n  query Me {\n    me {\n      id\n      email\n      name\n      role\n    }\n  }\n": types.MeDocument,
    "\n  mutation Signup($input: SignupInput!) {\n    signup(input: $input) {\n      id\n      email\n      name\n      role\n    }\n  }\n": types.SignupDocument,
    "\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      id\n      email\n      name\n      role\n    }\n  }\n": types.LoginDocument,
    "\n  mutation Logout {\n    logout\n  }\n": types.LogoutDocument,
    "\n  query Todos {\n    todos {\n      id\n      title\n      completed\n    }\n  }\n": types.TodosDocument,
    "\n  mutation CreateTodo($input: CreateTodoInput!) {\n    createTodo(input: $input) {\n      id\n      title\n      completed\n    }\n  }\n": types.CreateTodoDocument,
    "\n  mutation UpdateTodo($id: ID!, $input: UpdateTodoInput!) {\n    updateTodo(id: $id, input: $input) {\n      id\n      title\n      completed\n    }\n  }\n": types.UpdateTodoDocument,
    "\n  mutation DeleteTodo($id: ID!) {\n    deleteTodo(id: $id)\n  }\n": types.DeleteTodoDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Me {\n    me {\n      id\n      email\n      name\n      role\n    }\n  }\n"): typeof import('./graphql').MeDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Signup($input: SignupInput!) {\n    signup(input: $input) {\n      id\n      email\n      name\n      role\n    }\n  }\n"): typeof import('./graphql').SignupDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      id\n      email\n      name\n      role\n    }\n  }\n"): typeof import('./graphql').LoginDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Logout {\n    logout\n  }\n"): typeof import('./graphql').LogoutDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Todos {\n    todos {\n      id\n      title\n      completed\n    }\n  }\n"): typeof import('./graphql').TodosDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateTodo($input: CreateTodoInput!) {\n    createTodo(input: $input) {\n      id\n      title\n      completed\n    }\n  }\n"): typeof import('./graphql').CreateTodoDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateTodo($id: ID!, $input: UpdateTodoInput!) {\n    updateTodo(id: $id, input: $input) {\n      id\n      title\n      completed\n    }\n  }\n"): typeof import('./graphql').UpdateTodoDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteTodo($id: ID!) {\n    deleteTodo(id: $id)\n  }\n"): typeof import('./graphql').DeleteTodoDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
