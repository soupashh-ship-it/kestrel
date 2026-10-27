<script lang="ts">
  import { CheckListIcon, Clock01Icon, Note01Icon } from "@hugeicons/core-free-icons";
  import * as m from "$shared/i18n/messages";
  import { preferences, type PreferenceKey } from "$domain/preferences";
  import Icon from "$shared/ui/Icon";
  import Switch from "$shared/ui/Switch";

  type Feature = "notes" | "tasks" | "time";
  let { feature, card = false }: { feature: Feature; card?: boolean } = $props();

  const copy = {
    notes: {
      icon: Note01Icon,
      title: m.feature_notes_title,
      on: m.feature_notes_on,
      off: m.feature_notes_off,
    },
    tasks: {
      icon: CheckListIcon,
      title: m.feature_tasks_title,
      on: m.feature_tasks_on,
      off: m.feature_tasks_off,
    },
    time: {
      icon: Clock01Icon,
      title: m.feature_time_title,
      on: m.feature_time_on,
      off: m.feature_time_off,
    },
  };
  const item = $derived(copy[feature]);
  const key = $derived(`${feature}.enabled` as PreferenceKey);
  const on = $derived(preferences.enabled(feature));

  function change(next: boolean) {
    void preferences.set(key, next ? "true" : "false");
  }
</script>

<div class={["feature", card ? "card" : "ui-settings-row"]} data-setting={key} data-on={on}>
  <span class="tile" aria-hidden="true"><Icon icon={item.icon} size={card ? 20 : 17} /></span>
  <div class="copy">
    <h3>{item.title()}</h3>
    <p>{on ? item.on() : item.off()}</p>
  </div>
  <Switch
    label={item.title()}
    labelHidden
    checked={on}
    disabled={preferences.saving()}
    onchange={change}
  />
</div>

<style>
  .feature {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    box-sizing: border-box;
    min-block-size: 60px;
    padding: 11px 16px 11px 14px;
  }

  /* Inset at the label, as Settings rows divide. */
  :global(.ui-settings-row) + .feature:not(.card)::before {
    content: "";
    position: absolute;
    inset-inline: 58px 0;
    top: 0;
    height: 1px;
    background: var(--color-border);
  }

  .feature.card {
    gap: 14px;
    margin-block-end: 34px;
    padding: 16px 18px 16px 16px;
    border-radius: var(--radius-card);
    background: var(--color-surface);
    box-shadow: var(--shadow-card);
  }

  .tile {
    display: grid;
    flex: none;
    inline-size: 32px;
    block-size: 32px;
    border-radius: var(--radius-control);
    background: var(--color-fill);
    color: var(--color-text);
    place-items: center;
    transition: color var(--motion-base) var(--ease-out);
  }

  .card .tile {
    inline-size: 40px;
    block-size: 40px;
  }

  .feature[data-on="false"] .tile {
    color: var(--color-muted);
  }

  .copy {
    flex: 1;
    min-width: 0;
  }

  h3 {
    margin: 0;
    color: var(--color-text);
    font-size: 13px;
    font-weight: 550;
    line-height: 18px;
    letter-spacing: -0.006em;
  }

  .card h3 {
    font-size: 15px;
    font-weight: 600;
    line-height: 20px;
    letter-spacing: -0.012em;
  }

  .copy > p {
    margin: 2px 0 0;
    color: var(--color-muted);
    font-size: var(--text-label);
    line-height: 1.5;
  }

  @media (forced-colors: active) {
    /* Inset at the label, as Settings rows divide. */
    :global(.ui-settings-row) + .feature:not(.card)::before {
      content: "";
      position: absolute;
      inset-inline: 58px 0;
      top: 0;
      height: 1px;
      background: var(--color-border);
    }

    .feature.card {
      border: 1px solid ButtonText;
      box-shadow: none;
    }
  }
</style>
