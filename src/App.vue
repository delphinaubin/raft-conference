<template>
  <h1>Raft algorithm demo</h1>
  <NodeVisualizer></NodeVisualizer>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import NodeVisualizer from "./components/NodeVisualizer.vue";

@Options({
  components: {
    NodeVisualizer,
  },
})
export default class App extends Vue {}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
