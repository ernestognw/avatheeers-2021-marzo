
import AvatheeerArtifact from '../build/contracts/Avatheeers.json';

class Avatheeer {
  constructor(web3, netId) {
    this.abi = AvatheeerArtifact.abi;
    this.address = AvatheeerArtifact.networks[netId].address;
    this.contract = new web3.eth.Contract(this.abi, this.address);
  }

  /**
   * Loads all Avatheeer owned by user
   *
   * @param {string} address
   */
  getAvatheeersByOwner = async (address) => {
    const avatheeerId = await this.contract.methods
      .getAvatheeersByOwner(address)
      .call();

    const avatheeersPromise = avatheeerId.map((avatheeerId) =>
      this.contract.methods.avatheeers(avatheeerId).call()
    );

    const avatheeers = await Promise.all(avatheeersPromise);

    return avatheeers.map((avatheeer, index) => ({
      id: avatheeerId[index],
      name: avatheeer[0],
      dna: avatheeer[1],
    }));
  };

  /**
   * Generates random DNA from string
   *
   * @param {string} name
   * @param {string} address
   */
  getRandomDna = (name, address) =>
    this.contract.methods.generateRandomDna(name, address).call();

  /**
   * Creates random Avatheeer from string (name)
   *
   * @param {string} name
   * @param {string} address
   */
  createRandomAvatheeer = (name, address) =>
    new Promise((resolve, reject) => {
      // Calls the public `createRandomAvatheeer` function from the smart contract
      this.contract.methods
        .createRandomAvatheeer(name)
        .send({
          from: address,
          gas: 1000000,
          gasPrice: 1000000000,
          gasLimit: 1000000,
        })
        .on('error', reject)
        .on('receipt', resolve);
    });

  /**
   * Gifts Avatheeer
   *
   * @param {string} to
   * @param {string|number} avatheeerId
   * @param {string} address
   */
  giftAvatheeer = (to, avatheeerId, address) =>
    new Promise((resolve, reject) => {
      // Calls the public `transferFrom` function from the smart contract
      this.contract.methods
        .transferFrom(address, to, avatheeerId)
        .send({
          from: address,
          gas: 1000000,
          gasPrice: 1000000000,
          gasLimit: 1000000,
        })
        .on('error', reject)
        .on('receipt', resolve);
    });

  /**
   * Check if address is valid
   * @param {string} address
   */
  isValidAddress = (address) => /^(0x)?[0-9a-f]{40}$/i.test(address);

  /**
   * Completely burns an avatheeer
   *
   * @param {string|number} avatheeerId
   * @param {string} address
   */
  burn = (avatheeerId, address) =>
    new Promise((resolve, reject) => {
      // Calls the public `burn` function from the smart contract
      this.contract.methods
        .burn(avatheeerId)
        .send({
          from: address,
          gas: 1000000,
          gasPrice: 1000000000,
          gasLimit: 1000000,
        })
        .on('error', reject)
        .on('receipt', resolve);
    });
}

export default Avatheeer;
