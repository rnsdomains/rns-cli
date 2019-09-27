const Contract = require('web3-eth-contract');
const namehash = require('eth-ens-namehash').hash;

if (process.argv.length !== 3) {
  console.error('Input must be a name');
  process.exit();
}

// Connect to RSK Public nodes
const rskNode = 'https://public-node.rsk.co';
Contract.setProvider(rskNode);

// Instance RNS Registry
const rnsAbi = [
  {
    'constant': true,
    'inputs': [
      {
        'name': 'node',
        'type': 'bytes32'
      }
    ],
    'name': 'resolver',
    'outputs': [
      {
        'name': '',
        'type': 'address'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  }
];
const rnsAddress = '0xcb868aeabd31e2b66f74e9a55cf064abb31a4ad5';
const rns = new Contract(rnsAbi, rnsAddress);

let resolverAddress;

// Get the name's node
const node = namehash(process.argv[2])

// Get the name's resolver
rns.methods.resolver(node).call()
  .then(_resolverAddress => {
    if (_resolverAddress == '0x0000000000000000000000000000000000000000') {
      console.error('This name has no resolver');
      process.exit();
    }

    resolverAddress = _resolverAddress;
    const erc165Abi = [
      {
        "constant": true,
        "inputs": [
          {
            "name": "interfaceID",
            "type": "bytes4"
          }
        ],
        "name": "supportsInterface",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "pure",
        "type": "function"
      }
    ];

    const resolver = new Contract(erc165Abi, resolverAddress);

    return resolver;
  })
  .then(resolver => {
    // Check if it supports addr resolution
    const addrInterface = '0x3b3b57de';
    return resolver.methods.supportsInterface(addrInterface).call();
  })
  .then(supportsAddr => {
    if (!supportsAddr) {
      console.error('Addr resolution not supported');
      process.exit();
    }
  })
  .then(() => {
    // Get the addr resolution
    const addrResolverAbi = [
      {
        "constant": true,
        "inputs": [
        {
            "name": "node",
            "type": "bytes32"
        }
        ],
        "name": "addr",
        "outputs": [
        {
            "name": "",
            "type": "address"
        }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
    ];

    const resolver = new Contract(addrResolverAbi, resolverAddress);

    return resolver.methods.addr(node).call();
  })
  .then(console.log)
