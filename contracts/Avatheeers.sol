// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// Imports symbols from other files into the current contract.
// In this case, a series of helper contracts from OpenZeppelin.
// Learn more: https://docs.soliditylang.org/en/v0.8.3/layout-of-source-files.html#importing-other-source-files

// IERC721 is the ERC721 interface that we'll use to make Avatheeer ERC721 compliant
// More about ERC721: https://eips.ethereum.org/EIPS/eip-721
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
// IERC721Receiver must be implemented to accept safe transfers.
// It is included on the ERC721 standard
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
// ERC165 is used to declare interface support for IERC721
// More about ERC165: https://eips.ethereum.org/EIPS/eip-165
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
// SafeMath will be used for every math operation
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
// Address will provide functions such as .isContract verification
import "@openzeppelin/contracts/utils/Address.sol";

// The `is` keyword is used to inherit functions and keywords from external contracts.
// In this case, `Avatheeer` inherits from the `IERC721` and `ERC165` contracts.
// Learn more: https://solidity.readthedocs.io/en/v0.8.3/contracts.html#inheritance
contract Avatheeers is IERC721, ERC165 {
    // Uses OpenZeppelin's SafeMath library to perform arithmetic operations safely.
    // Learn more: https://docs.openzeppelin.com/contracts/3.x/api/math#SafeMath
    using SafeMath for uint256;
    // Use OpenZeppelin's Address library to validate whether an address is
    // is a contract or not.
    // Learn more: https://docs.openzeppelin.com/contracts/3.x/api/utils#Address
    using Address for address;

    // Constant state variables in Solidity are similar to other languages
    // but you must assign from an expression which is constant at compile time.
    // Learn more: https://solidity.readthedocs.io/en/v0.8.3/contracts.html#constant-state-variables
    uint256 constant dnaDigits = 26;
    uint256 constant dnaModulus = 26**dnaDigits;

    // ERC165 identifier for the ERC721 interface got from
    // bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))
    bytes4 private constant _ERC721_RECEIVED = 0x150b7a02;

    // Struct types let you define your own type
    // Learn more: https://docs.soliditylang.org/en/v0.8.3/types.html#structs
    struct Avatheeer {
        string name;
        uint256 dna;
    }

    // Creates an empty array of Avatheeer structs
    Avatheeer[] public avatheeers;

    // Mapping from id of Avatheeer to its owner's address
    mapping(uint256 => address) public avatheeerToOwner;

    // Mapping from owner's address to number of owned token
    mapping(address => uint256) public ownerAvatheeerCount;

    // Mapping to validate that dna is not already taken
    mapping(uint256 => bool) public dnaAvatheeerExists;

    // Mapping from token ID to approved address
    mapping(uint256 => address) avatheeerApprovals;

    // You can nest mappings, this example maps owner to operator approvals
    mapping(address => mapping(address => bool)) private operatorApprovals;

    // Check if Avatheeer is unique and doesn't exist yet
    modifier isUnique(uint256 _dna) {
        require(
            !dnaAvatheeerExists[_dna],
            "Avatheeer with such dna already exists."
        );
        _;
    }

    // Creates a random Avatheeer from string (name)
    function createRandomAvatheeer(string memory _name) public {
        uint256 randDna = generateRandomDna(_name, msg.sender);
        _createAvatheeer(_name, randDna);
    }

    // Generates random DNA from string (name) and address of the owner (creator)
    function generateRandomDna(string memory _str, address _owner)
        public
        pure
        returns (
            // Functions marked as `pure` promise not to read from or modify the state
            // Learn more: https://solidity.readthedocs.io/en/v0.8.3/contracts.html#pure-functions
            uint256
        )
    {
        // Generates random uint from string (name) + address (owner)
        uint256 rand = uint256(keccak256(abi.encodePacked(_str))) + uint256(uint160(address(_owner)));
        rand = rand.mod(dnaModulus);
        return rand;
    }

    // Internal function to create a random Avatheeer from string (name) and DNA
    function _createAvatheeer(string memory _name, uint256 _dna)
        internal
        // The `internal` keyword means this function is only visible
        // within this contract and contracts that derive this contract
        // Learn more: https://solidity.readthedocs.io/en/v0.8.3/contracts.html#visibility-and-getters
        // `isUnique` is a function modifier that checks if the avatheeer already exists
        // Learn more: https://solidity.readthedocs.io/en/v0.8.3/structure-of-a-contract.html#function-modifiers
        isUnique(_dna)
    {
        // Adds Avatheeer to array of Avatheeers and get id
        avatheeers.push(Avatheeer(_name, _dna));
        uint256 id = avatheeers.length.sub(1);

        // Mark as existent avatheeer name and dna
        dnaAvatheeerExists[_dna] = true;

        // Checks that Avatheeer owner is the same as current user
        // Learn more: https://solidity.readthedocs.io/en/v0.8.3/control-structures.html#error-handling-assert-require-revert-and-exceptions
        assert(avatheeerToOwner[id] == address(0));

        // Maps the Avatheeer to the owner
        avatheeerToOwner[id] = msg.sender;
        ownerAvatheeerCount[msg.sender] = ownerAvatheeerCount[msg.sender].add(
            1
        );
    }

    // Returns array of Avatheeers found by owner
    function getAvatheeersByOwner(address _owner)
        public
        view
        returns (
            // Functions marked as `view` promise not to modify state
            // Learn more: https://solidity.readthedocs.io/en/v0.8.3/contracts.html#view-functions
            uint256[] memory
        )
    {
        // Uses the `memory` storage location to store values only for the
        // lifecycle of this function call.
        // Learn more: https://solidity.readthedocs.io/en/v0.8.3/introduction-to-smart-contracts.html#storage-memory-and-the-stack
        uint256[] memory result = new uint256[](ownerAvatheeerCount[_owner]);
        uint256 counter = 0;
        for (uint256 i = 0; i < avatheeers.length; i++) {
            if (avatheeerToOwner[i] == _owner) {
                result[counter] = i;
                counter++;
            }
        }
        return result;
    }

    // Returns count of Avatheeers by address
    function balanceOf(address _owner)
        public
        override
        view
        returns (uint256 _balance)
    {
        return ownerAvatheeerCount[_owner];
    }

    // Returns owner of the Avatheeer found by id
    function ownerOf(uint256 _avatheeerId)
        public
        override
        view
        returns (address _owner)
    {
        address owner = avatheeerToOwner[_avatheeerId];
        require(owner != address(0), "Invalid Avatheeer ID.");
        return owner;
    }

    /**
     * Safely transfers the ownership of a given token ID to another address
     * If the target address is a contract, it must implement `onERC721Received`,
     * which is called upon a safe transfer, and return the magic value
     * `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`;
     * otherwise, the transfer is reverted.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 avatheeerId
    ) public override {
        // solium-disable-next-line arg-overflow
        safeTransferFrom(from, to, avatheeerId, "");
    }

    // Transfers Avatheeer and ownership to other address
    function transferFrom(
        address _from,
        address _to,
        uint256 _avatheeerId
    ) public override {
        require(_from != address(0) && _to != address(0), "Invalid address.");
        require(_exists(_avatheeerId), "Avatheeer does not exist.");
        require(_from != _to, "Cannot transfer to the same address.");
        require(
            _isApprovedOrOwner(msg.sender, _avatheeerId),
            "Address is not approved."
        );

        ownerAvatheeerCount[_to] = ownerAvatheeerCount[_to].add(1);
        ownerAvatheeerCount[_from] = ownerAvatheeerCount[_from].sub(1);
        avatheeerToOwner[_avatheeerId] = _to;

        // Emits event defined in the imported IERC721 contract
        emit Transfer(_from, _to, _avatheeerId);
        _clearApproval(_to, _avatheeerId);
    }

    // Checks if Avatheeer exists
    function _exists(uint256 avatheeerId) internal view returns (bool) {
        address owner = avatheeerToOwner[avatheeerId];
        return owner != address(0);
    }

    // Checks if address is owner or is approved to transfer Avatheeer
    function _isApprovedOrOwner(address spender, uint256 avatheeerId)
        internal
        view
        returns (bool)
    {
        address owner = avatheeerToOwner[avatheeerId];
        // Disable solium check because of
        // https://github.com/duaraghav8/Solium/issues/175
        // solium-disable-next-line operator-whitespace
        return (spender == owner ||
            getApproved(avatheeerId) == spender ||
            isApprovedForAll(owner, spender));
    }

    /**
     * Private function to clear current approval of a given token ID
     * Reverts if the given address is not indeed the owner of the token
     */
    function _clearApproval(address owner, uint256 _avatheeerId) private {
        require(
            avatheeerToOwner[_avatheeerId] == owner,
            "Must be avatheeer owner."
        );
        require(_exists(_avatheeerId), "Avatheeer does not exist.");
        if (avatheeerApprovals[_avatheeerId] != address(0)) {
            avatheeerApprovals[_avatheeerId] = address(0);
        }
    }

    // Approves other address to transfer ownership of Avatheeer
    function approve(address _to, uint256 _avatheeerId) public override {
        require(
            msg.sender == avatheeerToOwner[_avatheeerId],
            "Must be the Avatheeer owner."
        );
        avatheeerApprovals[_avatheeerId] = _to;
        emit Approval(msg.sender, _to, _avatheeerId);
    }

    // Returns approved address for specific Avatheeer
    function getApproved(uint256 _avatheeerId)
        public
        override
        view
        returns (address operator)
    {
        require(_exists(_avatheeerId), "Avatheeer does not exist.");
        return avatheeerApprovals[_avatheeerId];
    }

    /*
     * Sets or unsets the approval of a given operator
     * An operator is allowed to transfer all tokens of the sender on their behalf
     */
    function setApprovalForAll(address to, bool approved) public override {
        require(to != msg.sender, "Cannot approve own address");
        operatorApprovals[msg.sender][to] = approved;
        emit ApprovalForAll(msg.sender, to, approved);
    }

    // Tells whether an operator is approved by a given owner
    function isApprovedForAll(address owner, address operator)
        public
        override
        view
        returns (bool)
    {
        return operatorApprovals[owner][operator];
    }

    /**
     * Safely transfers the ownership of a given token ID to another address
     * If the target address is a contract, it must implement `onERC721Received`,
     * which is called upon a safe transfer, and return the magic value
     * `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`;
     * otherwise, the transfer is reverted.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 avatheeerId,
        bytes memory _data
    ) public override {
        transferFrom(from, to, avatheeerId);
        require(
            _checkOnERC721Received(from, to, avatheeerId, _data),
            "Must implmement onERC721Received."
        );
    }

    /**
     * Internal function to invoke `onERC721Received` on a target address
     * The call is not executed if the target address is not a contract
     */
    function _checkOnERC721Received(
        address from,
        address to,
        uint256 avatheeerId,
        bytes memory _data
    ) internal returns (bool) {
        if (!to.isContract()) {
            return true;
        }

        bytes4 retval = IERC721Receiver(to).onERC721Received(
            msg.sender,
            from,
            avatheeerId,
            _data
        );
        return (retval == _ERC721_RECEIVED);
    }

    // Burns a Avatheeer - destroys Token completely
    // The `external` function modifier means this function is
    // part of the contract interface and other contracts can call it
    function burn(uint256 _avatheeerId) external {
        require(msg.sender != address(0), "Invalid address.");
        require(_exists(_avatheeerId), "Avatheeer does not exist.");
        require(
            _isApprovedOrOwner(msg.sender, _avatheeerId),
            "Address is not approved."
        );

        ownerAvatheeerCount[msg.sender] = ownerAvatheeerCount[msg.sender].sub(
            1
        );
        avatheeerToOwner[_avatheeerId] = address(0);
    }

    // Takes ownership of Avatheeer - only for approved users
    function takeOwnership(uint256 _avatheeerId) public {
        require(
            _isApprovedOrOwner(msg.sender, _avatheeerId),
            "Address is not approved."
        );
        address owner = ownerOf(_avatheeerId);
        transferFrom(owner, msg.sender, _avatheeerId);
    }
}
