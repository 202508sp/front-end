declare global {
	namespace App {
	}
}

/// <reference types="@sveltejs/kit" />
declare module '*.svelte' {
  import type { Component } from 'svelte';
  const component: Component;
  export default component;
}


export {};
