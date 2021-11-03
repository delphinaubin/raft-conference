<template>
  <a-tooltip>
    <template #title>{{ name }}</template>
    <a-progress
      type="circle"
      :percent="remainingTimeInPercent"
      :format="
        () => `${Math.round((this.time - this.timePassedSinceStart) / 1000)}s`
      "
      :width="30"
    />
  </a-tooltip>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";

@Options({
  props: {
    time: Number,
    name: String,
  },
})
export default class NodeTimer extends Vue {
  time!: number;
  name!: string;
  timePassedSinceStart = 0;
  intervalId: number | undefined;

  get remainingTimeInPercent(): number {
    return ~~((this.timePassedSinceStart / this.time) * 100);
  }

  created(): void {
    const interval = 10;
    this.intervalId = setInterval(() => {
      this.timePassedSinceStart += interval;
      if (this.timePassedSinceStart >= this.time) {
        this.stopTimerAnimation();
      }
    }, interval);
  }

  beforeUnmount(): void {
    this.stopTimerAnimation();
  }

  private stopTimerAnimation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.intervalId = undefined;
  }
}
</script>
