/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/silentswap_payroll.json`.
 */
export type SilentswapPayroll = {
  "address": "9ideARSjLdYXZut2MqH4zwDXn4yZhFyopzjQHJKVFudn",
  "metadata": {
    "name": "silentswapPayroll",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Privacy-preserving payroll management on Solana"
  },
  "instructions": [
    {
      "name": "addRecipient",
      "docs": [
        "Add a new recipient to the employer's payroll"
      ],
      "discriminator": [
        207,
        170,
        166,
        28,
        210,
        186,
        242,
        145
      ],
      "accounts": [
        {
          "name": "recipient",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  99,
                  105,
                  112,
                  105,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "employer"
              },
              {
                "kind": "account",
                "path": "wallet"
              }
            ]
          }
        },
        {
          "name": "employer",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  109,
                  112,
                  108,
                  111,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "wallet",
          "docs": [
            "The wallet address of the recipient (for PDA derivation)"
          ]
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "employer"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "role",
          "type": "string"
        },
        {
          "name": "departmentId",
          "type": "u8"
        },
        {
          "name": "category",
          "type": "u8"
        }
      ]
    },
    {
      "name": "createPaymentRecord",
      "docs": [
        "Create a payment record (when initiating a SilentSwap payment)",
        "NOTE: Amount is NOT stored for privacy"
      ],
      "discriminator": [
        202,
        83,
        2,
        64,
        167,
        74,
        251,
        135
      ],
      "accounts": [
        {
          "name": "paymentRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  97,
                  121,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "employer"
              },
              {
                "kind": "account",
                "path": "recipient"
              },
              {
                "kind": "account",
                "path": "employer.payment_count",
                "account": "employer"
              }
            ]
          }
        },
        {
          "name": "employer",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  109,
                  112,
                  108,
                  111,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          },
          "relations": [
            "recipient"
          ]
        },
        {
          "name": "recipient",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  99,
                  105,
                  112,
                  105,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "employer"
              },
              {
                "kind": "account",
                "path": "recipient.wallet",
                "account": "recipient"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "employer"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "silentswapOrderId",
          "type": "string"
        }
      ]
    },
    {
      "name": "deactivateRecipient",
      "docs": [
        "Deactivate a recipient (soft delete)"
      ],
      "discriminator": [
        70,
        178,
        212,
        188,
        41,
        235,
        0,
        185
      ],
      "accounts": [
        {
          "name": "recipient",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  99,
                  105,
                  112,
                  105,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "employer"
              },
              {
                "kind": "account",
                "path": "recipient.wallet",
                "account": "recipient"
              }
            ]
          }
        },
        {
          "name": "employer",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  109,
                  112,
                  108,
                  111,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          },
          "relations": [
            "recipient"
          ]
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "employer"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "initializeEmployer",
      "docs": [
        "Initialize an employer account"
      ],
      "discriminator": [
        80,
        198,
        77,
        100,
        19,
        208,
        189,
        202
      ],
      "accounts": [
        {
          "name": "employer",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  109,
                  112,
                  108,
                  111,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        }
      ]
    },
    {
      "name": "markPaymentCompleted",
      "docs": [
        "Update payment status to completed"
      ],
      "discriminator": [
        52,
        233,
        25,
        249,
        167,
        45,
        65,
        219
      ],
      "accounts": [
        {
          "name": "paymentRecord",
          "writable": true
        },
        {
          "name": "employer",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  109,
                  112,
                  108,
                  111,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          },
          "relations": [
            "paymentRecord"
          ]
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "employer"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "markPaymentFailed",
      "docs": [
        "Update payment status to failed"
      ],
      "discriminator": [
        54,
        41,
        108,
        114,
        178,
        229,
        255,
        110
      ],
      "accounts": [
        {
          "name": "paymentRecord",
          "writable": true
        },
        {
          "name": "employer",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  109,
                  112,
                  108,
                  111,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          },
          "relations": [
            "paymentRecord"
          ]
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "employer"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "reactivateRecipient",
      "docs": [
        "Reactivate a recipient"
      ],
      "discriminator": [
        240,
        80,
        177,
        8,
        222,
        148,
        79,
        85
      ],
      "accounts": [
        {
          "name": "recipient",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  99,
                  105,
                  112,
                  105,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "employer"
              },
              {
                "kind": "account",
                "path": "recipient.wallet",
                "account": "recipient"
              }
            ]
          }
        },
        {
          "name": "employer",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  109,
                  112,
                  108,
                  111,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          },
          "relations": [
            "recipient"
          ]
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "employer"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "updateRecipient",
      "docs": [
        "Update recipient details"
      ],
      "discriminator": [
        55,
        190,
        61,
        121,
        131,
        132,
        8,
        54
      ],
      "accounts": [
        {
          "name": "recipient",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  99,
                  105,
                  112,
                  105,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "employer"
              },
              {
                "kind": "account",
                "path": "recipient.wallet",
                "account": "recipient"
              }
            ]
          }
        },
        {
          "name": "employer",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  109,
                  112,
                  108,
                  111,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          },
          "relations": [
            "recipient"
          ]
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "employer"
          ]
        }
      ],
      "args": [
        {
          "name": "name",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "role",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "departmentId",
          "type": {
            "option": "u8"
          }
        },
        {
          "name": "category",
          "type": {
            "option": "u8"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "employer",
      "discriminator": [
        34,
        80,
        59,
        57,
        83,
        119,
        213,
        106
      ]
    },
    {
      "name": "paymentRecord",
      "discriminator": [
        202,
        168,
        56,
        249,
        127,
        226,
        86,
        226
      ]
    },
    {
      "name": "recipient",
      "discriminator": [
        80,
        186,
        47,
        196,
        232,
        251,
        21,
        148
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "nameTooLong",
      "msg": "Name exceeds maximum length"
    },
    {
      "code": 6001,
      "name": "roleTooLong",
      "msg": "Role exceeds maximum length"
    },
    {
      "code": 6002,
      "name": "orderIdTooLong",
      "msg": "Order ID exceeds maximum length"
    },
    {
      "code": 6003,
      "name": "invalidPaymentStatus",
      "msg": "Invalid payment status for this operation"
    }
  ],
  "types": [
    {
      "name": "employer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "docs": [
              "Wallet that owns this employer account"
            ],
            "type": "pubkey"
          },
          {
            "name": "name",
            "docs": [
              "Business/employer name"
            ],
            "type": "string"
          },
          {
            "name": "recipientCount",
            "docs": [
              "Number of recipients added"
            ],
            "type": "u32"
          },
          {
            "name": "paymentCount",
            "docs": [
              "Number of payment records created"
            ],
            "type": "u32"
          },
          {
            "name": "createdAt",
            "docs": [
              "Account creation timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "paymentRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "employer",
            "docs": [
              "Parent employer account"
            ],
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "docs": [
              "Recipient account (PDA)"
            ],
            "type": "pubkey"
          },
          {
            "name": "recipientWallet",
            "docs": [
              "Recipient wallet (for reference)"
            ],
            "type": "pubkey"
          },
          {
            "name": "status",
            "docs": [
              "Payment status"
            ],
            "type": {
              "defined": {
                "name": "paymentStatus"
              }
            }
          },
          {
            "name": "silentswapOrderId",
            "docs": [
              "SilentSwap order ID (for reference)"
            ],
            "type": "string"
          },
          {
            "name": "createdAt",
            "docs": [
              "Record creation timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "docs": [
              "Last update timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "paymentStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "completed"
          },
          {
            "name": "failed"
          }
        ]
      }
    },
    {
      "name": "recipient",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "employer",
            "docs": [
              "Parent employer account"
            ],
            "type": "pubkey"
          },
          {
            "name": "wallet",
            "docs": [
              "Payment destination wallet"
            ],
            "type": "pubkey"
          },
          {
            "name": "name",
            "docs": [
              "Display name (anonymous alias)"
            ],
            "type": "string"
          },
          {
            "name": "role",
            "docs": [
              "Role/label (e.g., \"Engineer\", \"Designer\")"
            ],
            "type": "string"
          },
          {
            "name": "isActive",
            "docs": [
              "Whether recipient is active"
            ],
            "type": "bool"
          },
          {
            "name": "createdAt",
            "docs": [
              "Account creation timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "lastPaymentTimestamp",
            "docs": [
              "Timestamp of the last payment initiation"
            ],
            "type": "i64"
          },
          {
            "name": "totalPayments",
            "docs": [
              "Total number of payments created for this recipient"
            ],
            "type": "u32"
          },
          {
            "name": "departmentId",
            "docs": [
              "Department ID (0: Eng, 1: Mkt, 2: Sales, 3: Ops, 4: HR)"
            ],
            "type": "u8"
          },
          {
            "name": "category",
            "docs": [
              "Category ID (0: Full-time, 1: Part-time, 2: Contractor)"
            ],
            "type": "u8"
          },
          {
            "name": "bump",
            "docs": [
              "PDA bump"
            ],
            "type": "u8"
          }
        ]
      }
    }
  ]
};
