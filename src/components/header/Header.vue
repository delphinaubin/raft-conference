<template>
  <div class="header-container">
    <h1>Raft algorithm demo</h1>
    <div class="header-actions">
      <a-button @click="toggleDebugMode" type="primary">
        <BugOutlined /> Debug</a-button
      >
      <a-button @click="stopAlgorithm" type="primary" v-if="isAlgorithmRunning">
        <PauseOutlined /> Stop algorithm</a-button
      >
      <a-alert
        message="Algorithm is stopped"
        type="warning"
        v-if="!isAlgorithmRunning"
        show-icon
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { BugOutlined, PauseOutlined } from "@ant-design/icons-vue";

@Options({
  components: {
    BugOutlined,
    PauseOutlined,
  },
  props: {
    isAlgorithmRunning: Boolean,
  },
})
export default class Header extends Vue {
  isAlgorithmRunning!: boolean;
  toggleDebugMode(): void {
    (window as any).isDebugModeActivated = true;
  }
  stopAlgorithm(): void {
    this.$emit("stop-algorithm");
  }
}
</script>
<style scoped>
.header-container {
  padding-top: 1rem;
  text-align: center;
}
.header-actions {
  display: flex;
  justify-content: center;
}
.header-actions button {
  margin: 0 0.5rem;
}
</style>
