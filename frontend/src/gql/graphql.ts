/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type CreateTodoInput = {
  title: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type SignupInput = {
  email: string;
  name: string;
  password: string;
};

export type UpdateTodoInput = {
  completed?: boolean | null | undefined;
  title?: string | null | undefined;
};

export type UserRole =
  | 'ADMIN'
  | 'USER';

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { me: { id: string, email: string, name: string, role: UserRole } | null };

export type SignupMutationVariables = Exact<{
  input: SignupInput;
}>;


export type SignupMutation = { signup: { id: string, email: string, name: string, role: UserRole } };

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutation = { login: { id: string, email: string, name: string, role: UserRole } };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { logout: boolean };

export type TodosQueryVariables = Exact<{ [key: string]: never; }>;


export type TodosQuery = { todos: Array<{ id: string, title: string, completed: boolean }> };

export type CreateTodoMutationVariables = Exact<{
  input: CreateTodoInput;
}>;


export type CreateTodoMutation = { createTodo: { id: string, title: string, completed: boolean } };

export type UpdateTodoMutationVariables = Exact<{
  id: string | number;
  input: UpdateTodoInput;
}>;


export type UpdateTodoMutation = { updateTodo: { id: string, title: string, completed: boolean } };

export type DeleteTodoMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteTodoMutation = { deleteTodo: boolean };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const MeDocument = new TypedDocumentString(`
    query Me {
  me {
    id
    email
    name
    role
  }
}
    `) as unknown as TypedDocumentString<MeQuery, MeQueryVariables>;
export const SignupDocument = new TypedDocumentString(`
    mutation Signup($input: SignupInput!) {
  signup(input: $input) {
    id
    email
    name
    role
  }
}
    `) as unknown as TypedDocumentString<SignupMutation, SignupMutationVariables>;
export const LoginDocument = new TypedDocumentString(`
    mutation Login($input: LoginInput!) {
  login(input: $input) {
    id
    email
    name
    role
  }
}
    `) as unknown as TypedDocumentString<LoginMutation, LoginMutationVariables>;
export const LogoutDocument = new TypedDocumentString(`
    mutation Logout {
  logout
}
    `) as unknown as TypedDocumentString<LogoutMutation, LogoutMutationVariables>;
export const TodosDocument = new TypedDocumentString(`
    query Todos {
  todos {
    id
    title
    completed
  }
}
    `) as unknown as TypedDocumentString<TodosQuery, TodosQueryVariables>;
export const CreateTodoDocument = new TypedDocumentString(`
    mutation CreateTodo($input: CreateTodoInput!) {
  createTodo(input: $input) {
    id
    title
    completed
  }
}
    `) as unknown as TypedDocumentString<CreateTodoMutation, CreateTodoMutationVariables>;
export const UpdateTodoDocument = new TypedDocumentString(`
    mutation UpdateTodo($id: ID!, $input: UpdateTodoInput!) {
  updateTodo(id: $id, input: $input) {
    id
    title
    completed
  }
}
    `) as unknown as TypedDocumentString<UpdateTodoMutation, UpdateTodoMutationVariables>;
export const DeleteTodoDocument = new TypedDocumentString(`
    mutation DeleteTodo($id: ID!) {
  deleteTodo(id: $id)
}
    `) as unknown as TypedDocumentString<DeleteTodoMutation, DeleteTodoMutationVariables>;