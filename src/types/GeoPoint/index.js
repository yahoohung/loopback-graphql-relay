module.exports = {
  GeoPoint: {
    name: 'GeoPoint',
    generated: false,
    meta: {
      category: 'TYPE',
      fields: {
        lat: {
          generated: false,
          meta: {
            scalar: true,
            type: 'Float',
          },
          resolve: obj => obj.lat
        },
        lng: {
          generated: false,
          meta: {
            scalar: true,
            type: 'Float',
          },
          resolve: obj => obj.lng
        }
      }
    }
  },
  GeoPointInput: {
    name: 'GeoPointInput',
    generated: false,
    meta: {
      category: 'TYPE',
      input: true,
      fields: {
        lat: {
          generated: false,
          meta: {
            scalar: true,
            required: true,
            type: 'Float',
          },
          resolve: obj => obj.lat
        },
        lng: {
          generated: false,
          meta: {
            scalar: true,
            required: true,
            type: 'Float',
          },
          resolve: obj => obj.lng
        }
      }
    }
  }
};
