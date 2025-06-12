<script lang="ts">
    import Card from "$lib/components/Card.svelte";
</script>

<Card
    id="user-list"
    title="利用者一覧"
    icon="material-symbols:person"
    list={[
        { name: "山田 太郎", icon: "material-symbols:person" },
        { name: "佐藤 花子", icon: "material-symbols:person" },
        { name: "鈴木 一郎", icon: "material-symbols:person" }
    ]}
    size={{ width: "400px", height: "300px" }}
/>