Component({
  data: {},
  lifetimes: {
    created: function () {
      console.log('[component] created');
    },
    attached: function () {
      console.log('[component] attached');
    },
    ready: function () {
      console.log('[component] ready');
    },
  },
  methods: {},
});
