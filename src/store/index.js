import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import _ from 'lodash'

Vue.use(Vuex)

// root state object.
// each Vuex instance is just a single state tree.
const state = {
  mapCollection: null,
  dataset: null,
  ref: null,
  networks: [],
  interactions: [],
  taxons: [],
  // Default loading values
  selectNet: 374,
  netCollection: [{'id': 374, 'name': 'Kolpelke 352', 'date': '1999-06-28T04:00:00.000Z', 'localisation': {'type': 'Point', 'coordinates': [6.8666666667, 51.1166666667]}, 'description': '1999-06-28, Germany, Nordrh.-Westfalen, Urdenbach, Urdenbacher KÃ¤mpe', 'public': true, 'all_interactions': false, 'created_at': '2018-04-13T14:57:34.606Z', 'updated_at': '2018-04-13T14:57:34.606Z', 'dataset_id': 18, 'environment_id': 355, 'user_id': 2, 'group': '6.8666666667_51.1166666667'}, {'id': 393, 'name': 'Kolpelke 371', 'date': '1999-09-13T04:00:00.000Z', 'localisation': {'type': 'Point', 'coordinates': [6.8666666667, 51.1166666667]}, 'description': '1999-09-13, Germany, Nordrh.-Westfalen, Urdenbach, Urdenbacher KÃ¤mpe', 'public': true, 'all_interactions': false, 'created_at': '2018-04-13T15:02:03.326Z', 'updated_at': '2018-04-13T15:02:03.326Z', 'dataset_id': 18, 'environment_id': 374, 'user_id': 2, 'group': '6.8666666667_51.1166666667'}, {'id': 397, 'name': 'Kolpelke 375', 'date': '1999-07-01T04:00:00.000Z', 'localisation': {'type': 'Point', 'coordinates': [6.8666666667, 51.1166666667]}, 'description': '1999-07-01, Germany, Nordrh.-Westfalen, Urdenbach, Urdenbacher KÃ¤mpe', 'public': true, 'all_interactions': false, 'created_at': '2018-04-13T15:02:48.629Z', 'updated_at': '2018-04-13T15:02:48.629Z', 'dataset_id': 18, 'environment_id': 378, 'user_id': 2, 'group': '6.8666666667_51.1166666667'}, {'id': 398, 'name': 'Kolpelke 376', 'date': '1999-06-30T04:00:00.000Z', 'localisation': {'type': 'Point', 'coordinates': [6.8666666667, 51.1166666667]}, 'description': '1999-06-30, Germany, Nordrh.-Westfalen, Urdenbach, Urdenbacher KÃ¤mpe', 'public': true, 'all_interactions': false, 'created_at': '2018-04-13T15:02:58.624Z', 'updated_at': '2018-04-13T15:02:58.624Z', 'dataset_id': 18, 'environment_id': 379, 'user_id': 2, 'group': '6.8666666667_51.1166666667'}],
  loading: true
}

const mutations = {
  // Loading
  changeLoadingState (state, loading) {
    state.loading = loading
  },
  // Networks
  storeNetworks (state, networks) {
    state.networks.push.apply(state.networks, networks)
  },
  emptyNetworks (state) {
    state.networks = []
  },
  // ID net
  setNet (state, selectNet) {
    state.selectNet = selectNet
  },
  // NetCollection for map
  setMapCollection (state, mapCollection) {
    state.mapCollection = mapCollection
  },
  setNetCollection (state, netCollection) {
    state.netCollection = netCollection
  },
  // Interactions
  storeInteractions (state, interactions) {
    state.interactions.push.apply(state.interactions, interactions)
  },
  emptyInteractions (state) {
    state.interactions = []
  },
  // Taxons
  storeTaxons (state, taxons) {
    state.taxons.push.apply(state.taxons, taxons)
  },
  emptyTaxons (state) {
    state.taxons = []
  },
  // Dataset
  storeDataset (state, dataset) {
    state.dataset = dataset
  },
  // Reference
  storeRef (state, ref) {
    state.ref = ref
  }
}

// actions are functions that causes side effects and can involve
// asynchronous operations.
const actions = {
  loadRef ({ commit }, refId) {
    return new Promise((resolve, reject) => {
      axios.get(process.env.BASE_URL + '/reference/' + refId)
        .then((response) => {
          commit('storeRef', response.data)
          return resolve()
        })
        .catch((err) => {
          return reject(err)
        })
    })
  },
  loadDataset ({ commit }, datasetId) {
    return new Promise((resolve, reject) => {
      axios.get(process.env.BASE_URL + '/dataset/' + datasetId)
        .then((response) => {
          commit('storeDataset', response.data)
          return resolve()
        })
        .catch((err) => {
          return reject(err)
        })
    })
  },
  loadNetworksCollection ({ commit, state }) {
    return new Promise((resolve) => {
      // Create collection
      let netCollection = _
        .chain(state.networks)
        .each(function (net) {
          net.group = net.localisation.coordinates.join('_')
        })
        .groupBy('group')
        .value()
      commit('setMapCollection', netCollection)
      return resolve()
    })
  },
  loadNetworks ({ commit }) {
    commit('emptyNetworks')
    return new Promise((resolve, reject) => {
      axios.get(process.env.BASE_URL + '/network?q=Kolpelke%&page=0')
        .then(response => {
          // store page 0
          commit('storeNetworks', response.data)
          // Check number of pages
          let range = response.headers['content-range'].match(/\d+/g).map(Number)
          let nPages = Math.ceil(range[2] / range[1]) - 1
          if (nPages > 0 && nPages !== Infinity) {
            let requests = []
            for (let i = 1; i <= nPages; i++) {
              requests.push(axios.get(process.env.BASE_URL + '/network?q=Kolpelke%&page=' + i))
            }
            Promise.all(requests)
              .then(responses => responses.forEach(
                response => {
                  commit('storeNetworks', response.data)
                }
              )).then(() => {
                commit('changeLoadingState', false)
                return resolve()
              }).catch((err) => {
                this.$log.error(err)
                return reject(err)
              })
          }
        })
    })
  },
  loadInteractions ({ commit }, ids) {
    return new Promise((resolve, reject) => {
      commit('emptyInteractions')
      let requests = []
      for (let index = 0; index < ids.length; index++) {
        const id = ids[index]
        requests.push(
          axios.get(process.env.BASE_URL + '/interaction?taxon_1=' + id + '&page=0')
        )
      }
      // TODO: Only page 0 covered by the code
      Promise.all(requests)
        .then(responses => responses.forEach(
          response => {
            commit('storeInteractions', response.data)
          }
        ))
        .then(() => {
          return resolve()
        })
        .catch((err) => {
          this.$log.error(err)
          return reject(err)
        })
    })
  },
  loadTaxons ({ commit }, idNet) {
    return new Promise((resolve, reject) => {
      axios.get(process.env.BASE_URL + '/taxon?network_id=' + idNet + '&page=0')
        .then(response => {
          commit('emptyTaxons')
          // store page 0
          commit('storeTaxons', response.data)
          // Check number of pages
          let range = response.headers['content-range'].match(/\d+/g).map(Number)
          let nPages = Math.ceil(range[2] / range[1]) - 1
          if (nPages > 0 && nPages !== Infinity) {
            let requests = []
            for (let i = 1; i <= nPages; i++) {
              requests.push(axios.get(process.env.BASE_URL + '/taxon?network_id=' + idNet + '&page=' + i))
            }
            Promise.all(requests)
              .then(responses => responses.forEach(
                response => {
                  commit('storeTaxons', response.data)
                  return resolve()
                }
              ))
              .catch((err) => {
                return reject(err)
              })
          }
        })
    })
  },
  setNet ({ commit }, selectNet) {
    return commit('setNet', selectNet)
  },
  setNetCollection ({ commit }, netCollection) {
    return commit('setNetCollection', netCollection)
  }
}

const getters = {
  getRef: (state) => {
    return state.ref
  },
  getDataset: (state) => {
    return state.dataset
  }
}

// A Vuex instance is created by combining the state, mutations, actions,
// and getters.
export default new Vuex.Store({
  state,
  getters,
  actions,
  mutations
})
