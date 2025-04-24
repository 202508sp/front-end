<script lang="ts">
	import { onMount } from 'svelte';
	import { familyLogin } from '$lib/store';
    import Icon from '@iconify/svelte';
	import { signInWithPopup } from 'firebase/auth';
	import { auth, provider } from '$lib/firebase';

	let isLoggedIn = false;
    
    const login = () => {
        if (typeof window === 'undefined') return;
        signInWithPopup(auth, provider)
            .then((result) => {
                familyLogin.set(result.user);
                window.localStorage.setItem('familyLogin', JSON.stringify(result.user));
                window.location.reload();
            })
            .catch((error) => {
                console.error(error);
            });
    }

	onMount(() => {
		if (typeof window === 'undefined') return;
		isLoggedIn = window.localStorage.getItem('familyLogin') !== null;
        if (isLoggedIn) {
            familyLogin.set(JSON.parse(window.localStorage.getItem('familyLogin')!));
        }
	});
</script>

{#if !isLoggedIn}
	<div class="w:100% h:100% fixed top:0 left:0 justify-content:center align-items:center flex">
		<div class="w:400px h:300px bg:white b:2px|solid|rgba(0,0,0,0.2) r:8px shadow:0|0|20px|rgba(0,0,0,0.2) flex flex:column justify-content:center align-items:center gap:36px p:24px">
            <p class="text:center">ファミリーポータルへのアクセスには<br>ログインが必要です</p>
            <button
                on:click={login}
                class="flex justify-content:center align-items:center gap:16px b:2px|solid|rgba(0,0,0,0.2) px:16px py:8px r:4px cursor:pointer"
            >
                <Icon icon="logos:google-icon" width="24" height="24" />
                <p class="text:1.2em pb:4px">Google でログインする</p>
            </button>
		</div>
	</div>
{/if}
