<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    BarController,
    LineController,
    DoughnutController,
    PieController,
    Title,
    Tooltip,
    Legend,
    Filler
  } from 'chart.js';
  import 'chartjs-adapter-date-fns';
  import type { ChartType, ChartData, ChartOptions } from '$lib/types/statistics';

  // Register Chart.js components
  Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    BarController,
    LineController,
    DoughnutController,
    PieController,
    Title,
    Tooltip,
    Legend,
    Filler
  );

  interface Props {
    type: ChartType;
    data: ChartData;
    options?: Partial<ChartOptions>;
    width?: number;
    height?: number;
    class?: string;
  }

  let {
    type,
    data,
    options = {},
    width = 400,
    height = 300,
    class: className = ''
  }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  const defaultOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const createChart = () => {
    if (!canvas) return;

    // Destroy existing chart
    if (chart) {
      chart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      plugins: {
        ...defaultOptions.plugins,
        ...options.plugins,
      },
      scales: {
        ...defaultOptions.scales,
        ...options.scales,
      },
    };

    chart = new Chart(ctx, {
      type: type as any,
      data,
      options: mergedOptions,
    });
  };

  const updateChart = () => {
    if (!chart) return;

    chart.data = data;
    chart.update();
  };

  onMount(() => {
    createChart();
  });

  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });

  // Reactive updates - recreate chart when type or options change
  $effect(() => {
    // Track dependencies
    type;
    options;
    
    if (canvas) {
      createChart();
    }
  });

  // Update chart data without recreating
  $effect(() => {
    if (chart) {
      chart.data = data;
      chart.update('none'); // Update without animation to prevent loops
    }
  });
</script>

<div class={`stat-chart ${className}`}>
  <canvas
    bind:this={canvas}
    {width}
    {height}
    class="max-w:full max-h:full"
  ></canvas>
</div>

<style>
  .stat-chart {
    position: relative;
    width: 100%;
    height: 100%;
  }
</style>