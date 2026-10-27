<script lang="ts">
  /** Kestrel's app icon itself, its own squircle and shadow included, the
   *  same in either theme. */
  let { size = 16 }: { size?: number } = $props();
</script>

<img
  class="zephium-tile"
  src="/kestrel-icon.png"
  srcset="/kestrel-icon.png 128w, /kestrel-icon@2x.png 256w"
  sizes={`${size}px`}
  width={size}
  height={size}
  alt=""
  aria-hidden="true"
  draggable="false"
/>

<style>
  .zephium-tile {
    display: inline-block;
    flex: none;
    object-fit: contain;
  }
</style>
