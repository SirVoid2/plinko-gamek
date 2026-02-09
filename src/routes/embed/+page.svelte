<script lang="ts">
  import Plinko from '$lib/components/Plinko';
  import Sidebar from '$lib/components/Sidebar';
  import { rowCountOptions } from '$lib/constants/game';
  import { balance, betAmount, riskLevel, rowCount } from '$lib/stores/game';
  import { RiskLevel } from '$lib/types';
  import { emitEmbedEventWithContext, isEmbedMode, setupEmbedBridge } from '$lib/utils/embed';
  import { setBalanceFromLocalStorage, writeBalanceToLocalStorage } from '$lib/utils/game';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';

  let isEmbedded = false;
  let isSyncingFromHost = false;

  const handleBeforeUnload = () => {
    if (!isEmbedded) {
      writeBalanceToLocalStorage();
    }
  };

  onMount(() => {
    isEmbedded = isEmbedMode();
    if (!isEmbedded) {
      setBalanceFromLocalStorage();
    } else {
      balance.set(0);
    }

    const applyHostUpdate = (update: () => void) => {
      isSyncingFromHost = true;
      update();
      queueMicrotask(() => {
        isSyncingFromHost = false;
      });
    };

    const teardown = setupEmbedBridge({
      onInit: (payload) => {
        applyHostUpdate(() => {
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
        });
      },
      onBalance: (payload) => {
        applyHostUpdate(() => {
          if (typeof payload.balance === 'number') {
            balance.set(payload.balance);
          }
        });
      },
      onConfig: (payload) => {
        applyHostUpdate(() => {
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
        });
      },
      onReset: () => {
        applyHostUpdate(() => {
          balance.set(0);
        });
      },
    });

    const unsubscribeBalance = balance.subscribe((value) => {
      if (isEmbedded) {
        emitEmbedEventWithContext('plinko:balance', { balance: value });
      }
    });
    let currentBetAmount = get(betAmount);
    let currentRowCount = get(rowCount);
    let currentRiskLevel = get(riskLevel);
    let configReady = false;
    const maybeEmitConfig = () => {
      if (!isEmbedded || isSyncingFromHost || !configReady) {
        return;
      }
      emitEmbedEventWithContext('plinko:config', {
        betAmount: currentBetAmount,
        rowCount: currentRowCount,
        riskLevel: currentRiskLevel,
      });
    };
    const unsubscribeBetAmount = betAmount.subscribe((value) => {
      currentBetAmount = value;
      maybeEmitConfig();
    });
    const unsubscribeRowCount = rowCount.subscribe((value) => {
      currentRowCount = value;
      maybeEmitConfig();
    });
    const unsubscribeRiskLevel = riskLevel.subscribe((value) => {
      currentRiskLevel = value;
      maybeEmitConfig();
    });
    configReady = true;

    return () => {
      teardown();
      unsubscribeBalance();
      unsubscribeBetAmount();
      unsubscribeRowCount();
      unsubscribeRiskLevel();
    };
  });
</script>

<svelte:window onbeforeunload={handleBeforeUnload} />

<div class="relative flex min-h-dvh w-full flex-col bg-gray-800">
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

</div>
