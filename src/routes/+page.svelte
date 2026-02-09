<script lang="ts">
  import LiveStatsWindow from '$lib/components/LiveStatsWindow/LiveStatsWindow.svelte';
  import Plinko from '$lib/components/Plinko';
  import Sidebar from '$lib/components/Sidebar';
  import { rowCountOptions } from '$lib/constants/game';
  import { balance, betAmount, riskLevel, rowCount } from '$lib/stores/game';
  import { RiskLevel } from '$lib/types';
  import { emitEmbedEventWithContext, isEmbedMode, setupEmbedBridge } from '$lib/utils/embed';
  import { setBalanceFromLocalStorage, writeBalanceToLocalStorage } from '$lib/utils/game';
  import GitHubLogo from 'phosphor-svelte/lib/GithubLogo';
  import { onMount } from 'svelte';

  let isEmbedded = false;

  const handleBeforeUnload = () => {
    if (!isEmbedded) {
      writeBalanceToLocalStorage();
    }
  };

  onMount(() => {
    isEmbedded = isEmbedMode();
    if (!isEmbedded) {
      setBalanceFromLocalStorage();
    }

    const teardown = setupEmbedBridge({
      onInit: (payload) => {
        if (typeof payload.balance === 'number') {
          balance.set(payload.balance);
        }
        if (typeof payload.betAmount === 'number') {
          betAmount.set(payload.betAmount);
        }
        if (
          typeof payload.rowCount === 'number' &&
          rowCountOptions.includes(payload.rowCount as (typeof rowCountOptions)[number])
        ) {
          rowCount.set(payload.rowCount as (typeof rowCountOptions)[number]);
        }
        if (
          typeof payload.riskLevel === 'string' &&
          Object.values(RiskLevel).includes(payload.riskLevel as RiskLevel)
        ) {
          riskLevel.set(payload.riskLevel as RiskLevel);
        }
      },
      onBalance: (payload) => {
        if (typeof payload.balance === 'number') {
          balance.set(payload.balance);
        }
      },
      onConfig: (payload) => {
        if (typeof payload.betAmount === 'number') {
          betAmount.set(payload.betAmount);
        }
        if (
          typeof payload.rowCount === 'number' &&
          rowCountOptions.includes(payload.rowCount as (typeof rowCountOptions)[number])
        ) {
          rowCount.set(payload.rowCount as (typeof rowCountOptions)[number]);
        }
        if (
          typeof payload.riskLevel === 'string' &&
          Object.values(RiskLevel).includes(payload.riskLevel as RiskLevel)
        ) {
          riskLevel.set(payload.riskLevel as RiskLevel);
        }
      },
      onReset: () => {
        balance.set(0);
      },
    });

    const unsubscribeBalance = balance.subscribe((value) => {
      if (isEmbedded) {
        emitEmbedEventWithContext('plinko:balance', { balance: value });
      }
    });

    return () => {
      teardown();
      unsubscribeBalance();
    };
  });
</script>

<svelte:window onbeforeunload={handleBeforeUnload} />

<div class="relative flex min-h-dvh w-full flex-col">
  <div class="flex-1 px-5">
    <div class="mx-auto mt-5 max-w-xl min-w-[300px] drop-shadow-xl md:mt-10 lg:max-w-7xl">
      <div class="flex flex-col-reverse overflow-hidden rounded-lg lg:w-full lg:flex-row">
        <Sidebar />
        <div class="flex-1">
          <Plinko />
        </div>
      </div>
    </div>
  </div>

  <SettingsWindow />
  <LiveStatsWindow />

  <footer class="px-5 pt-16 pb-4">
    <div class="mx-auto max-w-[40rem]">
      <div aria-hidden="true" class="h-[1px] bg-slate-700"></div>
      <div class="flex items-center justify-between p-2">
        <p class="text-sm text-slate-500">
          <a
            href="https://www.bbcasino.lovable.app"
            target="_blank"
            rel="noreferrer"
            class=" text-cyan-600 transition hover:text-cyan-500"
          >
            Emilio Mejias
          </a>
          © {new Date().getFullYear()}
        </p>
        <a
          href="https://github.com/SirVoid2/plinko-gamek"
          target="_blank"
          rel="noreferrer"
          class="flex items-center gap-1 p-1 text-sm text-slate-500 transition hover:text-cyan-500"
        >
          <GitHubLogo class="size-4" weight="bold" />
          <span>Source Code</span>
        </a>
      </div>
    </div>
  </footer>
</div>

<style lang="postcss">
  @reference "../app.css";

  :global(body) {
    @apply bg-gray-800;
  }
</style>
