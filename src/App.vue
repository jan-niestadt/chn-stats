<template>
  <div id="app">

    <div class='title'>
      <h1>CHN contents</h1>
      <a href="..">Back to the corpus</a>
    </div>

    <blockquote class="container" id="info">
      Documents: {{ chnStats.grouping_year.docs }}, tokens: {{ chnStats.grouping_year.tokens }}<br>

      We give the distribution for the following metadata fields:
      <br>
      year<br>
      year, languageVariant<br>
      year, medium<br>
      year, newspaper<br>
      languageVariant<br>
      medium<br>
      medium, languageVariant<br>
      newspaper
    </blockquote>
    <hr/>

    <CorpusCharts :stats="chnStats" />

  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import CorpusCharts from './components/CorpusCharts.vue';
import HighchartsVue from 'highcharts-vue';
import chnStats from '@/assets/stats.json';

Vue.use(HighchartsVue);

// TODO: make this work for other corpora as well (right now it's pretty much CHN-only...)

export default Vue.extend({
  name: 'App',
  components: {
    CorpusCharts
  },
  data() {
    return {
      chnStats,
    };
  },
});
</script>

<style lang="scss">

body {
  font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;
  font-size: 14px;  
}

</style>

<style scoped lang="scss">

.title {
  text-align: center;
}

h1 {
  font-size: 36px;
  font-weight: 500;
}

blockquote {
  margin: 2rem auto;
  font-size: 17.5px;
  max-width: 60rem;
}

</style>