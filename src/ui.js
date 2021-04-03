import Web3 from 'web3';
import Avatheeer from './avatheeer';
import { dnaVariants, notify } from './utils';
import {
  inventoryItem,
  emptyInventory,
  spinner,
  ropstenRequest,
} from './templates';

/**
 * Instantiate a class to handle UI elements management in order
 * to separate them from the Avatheeer operation
 */
class UI {
  /**
   * Class initialization
   */
  constructor() {
    this.web3 = null;
    this.avatheeer = null;

    this.getElements();
    this.addListeners();
    this.init();
  }

  /**
   * Collects UI elements to use in the future
   */
  getElements = () => {
    this.buttons = {
      create: document.getElementById('create-button'),
      connect: document.getElementById('connect-button'),
    };

    this.tabs = {
      inventory: document.getElementById('inventory-tab'),
    };

    this.containers = {
      loading: document.getElementById('loading-container'),
      welcome: document.getElementById('welcome-container'),
      main: document.getElementById('main-container'),
      avatheeerContainer: document.getElementById('avatheeer-container'),
      inventory: document.getElementById('inventory-container'),
    };

    this.inputs = {
      create: document.getElementById('create-input'),
    };
  };

  /**
   * Add main event listeners to different UI elements, so they can
   * perform the action they're expected
   */
  addListeners = () => {
    this.buttons.connect.addEventListener('click', this.init);
    this.inputs.create.addEventListener('change', this.updateCreateInput);
    this.buttons.create.addEventListener('click', this.createRandomAvatheeer);

    document.body.addEventListener('click', (event) => {
      if (event.target.classList.contains('button-gift')) {
        this.giftAvatheeer(event);
      } else if (event.target.classList.contains('button-kill')) {
        this.killAvatheeer(event);
      }
    });
  };

  /**
   * Creates an instance of web3 by requesting access to account information,
   * also, it validates that the page is opened using Ropsten, which is the
   * testnet selected for the example.
   *
   * In case something fails, such as web3 initialization, account access requesting, or
   * even any web3 call, this opens the welcome page in which we request to access
   * via metamask.
   */
  init = async () => {
    if (window.web3) {
      try {
        // Instantiate a new web3 with full capabilities
        this.web3 = new Web3(Web3.givenProvider, null, {});

        const netId = await this.web3.eth.net.getId();

        // Ropsten ID
        if (netId !== 3) {
          this.containers.loading.innerHTML = ropstenRequest;
          notify('This DApp needs to be loaded in Ropsten');
          return;
        }

        await this.web3.eth.requestAccounts();

        notify('DApp loaded correctly');

        this.showMain();
        // Creates an instance of avatheeer contract
        this.avatheeer = new Avatheeer(this.web3, netId);
        this.loadInventory();
      } catch (err) {
        notify('DApp not loaded');

        this.showWelcome();
      }
    } else {
      notify('Metamask is required');
      this.showWelcome();
    }
  };

  /**
   * Shows main section
   */
  showMain = () => {
    this.containers.welcome.classList.add('hidden');
    this.containers.loading.classList.add('hidden');
    this.containers.main.classList.remove('hidden');
  };

  /**
   * Shows welcome section
   */
  showWelcome = () => {
    this.containers.welcome.classList.remove('hidden');
    this.containers.loading.classList.add('hidden');
    this.containers.main.classList.add('hidden');
  };

  /**
   * Loads list of user owned avatheeers, so they can be accessed
   * through the inventory tab
   */
  loadInventory = async () => {
    const [address] = await this.web3.eth.getAccounts();
    const avatheeers = await this.avatheeer.getAvatheeersByOwner(address);

    this.containers.inventory.innerHTML = '';

    if (avatheeers.length > 0) {
      avatheeers.forEach(({ id, name, dna }) => {
        const avatheeerImage = this.generateAvatheeerSrc(dna);

        this.containers.inventory.insertAdjacentHTML(
          'beforeend',
          inventoryItem(id, name, dna, avatheeerImage)
        );
      });
    } else {
      this.containers.inventory.innerHTML = emptyInventory;
    }
  };

  /**
   * Updates container of Create new Avatheeer
   *
   * @param {{target: { value: string }}} avatheeerName is the value of the input with the name
   */
  updateCreateInput = async ({ target: { value: avatheeerName } }) => {
    if (avatheeerName.length > 0) {
      const [address] = await this.web3.eth.getAccounts();

      try {
        const avatheeerDna = await this.avatheeer.getRandomDna(
          avatheeerName,
          address
        );
        const avatheeerImage = this.generateAvatheeerSrc(avatheeerDna);

        this.containers.avatheeerContainer.src = avatheeerImage;
      } catch (err) {
        notify(err.message, 'error');
      }
    } else {
      this.containers.avatheeerContainer.src = './images/placeholder.png';
    }
  };

  /**
   * Creates an src for a custom avataaar using its API
   * to construct visual representation of the DNA
   *
   * @param {string} dna Unique identifier
   */
  generateAvatheeerSrc = (dna) => {
    let src = 'https://avataaars.io/?avatarStyle=Circle&';

    Object.keys(dnaVariants).forEach((key, index) => {
      const element =
        dna.substring(index * 2, (index + 1) * 2) % dnaVariants[key].length;
      src += `${key}=${dnaVariants[key][element]}&`;
    });

    return src;
  };

  /**
   * Creates a random avatheeer using contract instance
   */
  createRandomAvatheeer = async () => {
    // Validates name < 20 chars
    if (this.inputs.create.value.length > 20) {
      notify('Please name your Avatheeer with less than 20 characters');
      return;
    }

    // Validates name > 0 chars
    if (!this.inputs.create.value) {
      notify('Please enter valid name');
      return;
    }

    this.buttons.create.disabled = true;

    try {
      const [address] = await this.web3.eth.getAccounts();
      notify('Creating avatheeer');
      this.buttons.create.innerHTML = spinner;
      const { transactionHash } = await this.avatheeer.createRandomAvatheeer(
        this.inputs.create.value,
        address
      );
      notify('Token created');
      notify(transactionHash);

      // If success, wait for confirmation of transaction,
      // then clear form values
      this.containers.avatheeerContainer.innerHTML = '';
      this.inputs.create.value = '';
      this.containers.avatheeerContainer.src = './images/placeholder.png';

      await this.loadInventory();

      this.tabs.inventory.click();
    } catch (err) {
      notify(err.message, 'error');
    }

    this.buttons.create.innerText = 'Create';
    this.buttons.create.disabled = false;
  };

  /**
   * Kills an avatheeer
   *
   * @param {{string}} param0
   */
  killAvatheeer = async ({ target }) => {
    const confirmation = confirm('Are you sure?');
    const avatheeerContainer = document.getElementById(
      `avatheeer-${target.name}`
    );

    if (!confirmation) {
      notify('Canceled');
      return;
    }

    target.disabled = true;
    avatheeerContainer.classList.add('fade');

    const [address] = await this.web3.eth.getAccounts();

    notify('Killing avatheeer');
    target.disabled = true;
    target.innerHTML = spinner;
    try {
      const { transactionHash } = await this.avatheeer.burn(
        target.name,
        address
      );
      notify(`Avatheeer is gone: ${transactionHash}`);
      this.loadInventory();
    } catch (err) {
      notify(err.message, 'error');
    }
    target.innerText = 'Kill';
    target.disabled = false;
    avatheeerContainer.classList.remove('fade');
  };

  /**
   * Transfers an avather to somebody else's address
   *
   * @param {{string}} param0
   */
  giftAvatheeer = async ({ target }) => {
    const sendTo = prompt('Enter address which should receive your Avatheeer');
    const avatheeerContainer = document.getElementById(
      `avatheeer-${target.name}`
    );

    // To check if address is valid
    if (!this.avatheeer.isValidAddress(sendTo)) {
      notify('Please enter a valid address');
      return;
    }

    target.disabled = true;
    avatheeerContainer.classList.add('fade');

    const [address] = await this.web3.eth.getAccounts();

    notify('Sending avatheeer');
    target.innerHTML = spinner;
    target.disabled = true;
    try {
      const { transactionHash } = await this.avatheeer.giftAvatheeer(
        sendTo,
        target.name,
        address
      );
      notify('Avatheeer sent');
      notify(transactionHash);
      this.loadInventory();
    } catch (err) {
      notify(err.message, 'error');
    }
    target.innerText = 'Gift';
    target.disabled = false;
    avatheeerContainer.classList.remove('fade');
  };
}

export default UI;
