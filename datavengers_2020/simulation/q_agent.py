import numpy as np
import random as rand


class QAgent(object):
    def __init__(self, num_states=100, num_actions=3, alpha=0.2, gamma=0.9, rar=0.5, radr=0.99, dyna=0):
        self.num_states = num_states
        self.num_actions = num_actions
        self.alpha = alpha
        self.gamma = gamma
        self.rar = rar
        self.radr = radr
        self.dyna = dyna
        self.s = 0
        self.a = 0

        # Save and initialize the Q-Table to all zeros
        self.q_table = np.zeros((self.num_states, self.num_actions))

        # Memory for experience replay
        self.memory = []

        # Initialize for dyna
        if self.dyna > 0:
            self.Tc = np.ndarray(shape=(self.num_states, self.num_actions, self.num_states))
            self.Tc.fill(0.00001)
            self.T = self.Tc / self.Tc.sum(axis=2, keepdims=True)
            self.R = np.ndarray(shape=(self.q_table.shape))
            self.R.fill(-1.0)

    def __next_action(self, s):
        # Randomly assign a random action to take and update later if necessary
        action = rand.randint(0, self.num_actions - 1)

        # Find optimal action if the random action rate is smaller (its decayed over time)
        if self.rar < rand.random():
            action = np.argmax(self.q_table[s])

        return action

    def __run_dyna_Q(self, s_prime, r):
        # Update our encounter with the real world
        self.Tc[self.s, self.a, s_prime] += 1

        # Update the probability of landing on s'
        self.T = self.Tc / self.Tc.sum(axis=2, keepdims=True)

        # Update model with real experience
        self.R[self.s, self.a] = (1 - self.alpha) * self.R[self.s, self.a] + (self.alpha * r)

        # Hallucinate the required amount of time
        for _ in range(0, self.dyna):
            # Randomly select state and action
            dyna_s = rand.randint(0, self.num_states - 1)
            dyna_a = rand.randint(0, self.num_actions - 1)

            # Simulate what our next state would be
            dyna_s_prime = np.argmax(np.random.multinomial(1, self.T[dyna_s, dyna_a, :]))

            # Update the reward
            r = self.R[dyna_s, dyna_a]

            # Update Q-table with hallucinations tuple <s, a, s', r>
            self.q_table[dyna_s, dyna_a] = (1 - self.alpha) * self.q_table[dyna_s, dyna_a] + self.alpha * (
                r + self.gamma * self.q_table[dyna_s_prime, np.argmax(self.q_table[dyna_s_prime])]
            )

    def __run_experience_replay(self):
        for _ in range(0, self.dyna):
            # Randomly choose and observed experience
            [dyna_s, dyna_a, dyna_s_prime, dyna_r] = self.memory[rand.randint(0, len(self.memory) - 1)]

            # Update Q-table with hallucinations tuple <s, a, s', r>
            self.q_table[dyna_s, dyna_a] = (1 - self.alpha) * self.q_table[dyna_s, dyna_a] + self.alpha * (
                dyna_r + self.gamma * self.q_table[dyna_s_prime, np.argmax(self.q_table[dyna_s_prime])]
            )

    def query_set_state(self, s):
        self.s = s
        return self.__next_action(s)

    def query(self, s_prime, r):
        # Update Q-table with experience tuple <s, a, s', r>
        self.q_table[self.s, self.a] = (1 - self.alpha) * self.q_table[self.s, self.a] + self.alpha * (
            r + self.gamma * self.q_table[s_prime, np.argmax(self.q_table[s_prime])]
        )

        # Memorize experience tuple for experience replay
        self.memory.append([self.s, self.a, s_prime, r])

        # Find the next action to take
        action = self.__next_action(s_prime)
        if self.dyna != 0:
            # Run dyna-q model based
            # self.__run_dyna__(s_prime, r)
            # Run dyna-q by experience replay
            self.__run_experience_replay()

        # Random action rate decay
        self.rar *= self.radr
        # Update our current state and action
        self.s = s_prime
        self.a = action

        return action
