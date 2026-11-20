import type { CreateTodoInput, UpdateTodoInput } from "@template/shared";

import { graphql } from "@/gql/gql";
import type { TodosQuery } from "@/gql/graphql";
import { gqlRequest } from "@/lib/graphql-client";

// Plain request functions: no React here, so they are trivial to test and reuse.
// Ask only for the fields the UI shows: that is the point of GraphQL.

export type Todo = TodosQuery["todos"][number];

const TODOS = graphql(`
  query Todos {
    todos {
      id
      title
      completed
    }
  }
`);

const CREATE_TODO = graphql(`
  mutation CreateTodo($input: CreateTodoInput!) {
    createTodo(input: $input) {
      id
      title
      completed
    }
  }
`);

const UPDATE_TODO = graphql(`
  mutation UpdateTodo($id: ID!, $input: UpdateTodoInput!) {
    updateTodo(id: $id, input: $input) {
      id
      title
      completed
    }
  }
`);

const DELETE_TODO = graphql(`
  mutation DeleteTodo($id: ID!) {
    deleteTodo(id: $id)
  }
`);

export async function fetchTodos(): Promise<Todo[]> {
  return (await gqlRequest(TODOS)).todos;
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  return (await gqlRequest(CREATE_TODO, { input })).createTodo;
}

export async function updateTodo(id: string, input: UpdateTodoInput): Promise<Todo> {
  return (await gqlRequest(UPDATE_TODO, { id, input })).updateTodo;
}

export async function deleteTodo(id: string): Promise<void> {
  await gqlRequest(DELETE_TODO, { id });
}
