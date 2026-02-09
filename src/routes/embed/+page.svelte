<script lang="ts">
  import Balance from '$lib/components/Balance.svelte';
  import LiveStatsWindow from '$lib/components/LiveStatsWindow/LiveStatsWindow.svelte';
  import Plinko from '$lib/components/Plinko';
  import SettingsWindow from '$lib/components/SettingsWindow';
  import Sidebar from '$lib/components/Sidebar';
  import { rowCountOptions } from '$lib/constants/game';
  import { balance, betAmount, riskLevel, rowCount } from '$lib/stores/game';
  import { RiskLevel } from '$lib/types';
  import { emitEmbedEventWithContext, isEmbedMode, setupEmbedBridge } from '$lib/utils/embed';
  import { setBalanceFromLocalStorage, writeBalanceToLocalStorage } from '$lib/utils/game';
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

<div class="relative flex min-h-dvh w-full flex-col bg-gray-800">
  <div class="flex items-center justify-between border-b border-slate-700 px-4 py-3">
    <p class="text-sm font-semibold text-slate-200">Plinko</p>
    <Balance allowTopUp={false} />
  </div>

  <div class="flex-1 px-5">
    <div class="mx-auto mt-5 max-w-xl min-w-[300px] drop-shadow-xl md:mt-8 lg:max-w-7xl">
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
</div>
