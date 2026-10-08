#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Wed Oct  7 18:46:06 2026

@author: aryanagnihotri
"""

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genetic Algorithm on the SDS Personality Traits dataset.

Goal: evolve a linear classifier that predicts success (high = 1 / low = 0)
from the Big Five traits.

Chromosome = [w_neuroticism, w_extraversion, w_openness, w_agreeableness,
              w_conscientiousness, bias]   (real numbers)
Prediction = 1 if  w . x + bias > 0  else 0
Fitness    = classification accuracy on the training data
"""

import random
import pandas as pd
import matplotlib.pyplot as plt

CSV_PATH = "/Users/aryanagnihotri/Documents/SDS Personality Traits.csv"      # change if your file is elsewhere

df = pd.read_csv(CSV_PATH)
df.columns = [c.strip() for c in df.columns]     # remove stray spaces in headers

feature_cols = ["neuroticism", "extraversion", "openness_to_experience",
                "agreeableness", "conscientiousness"]
target_col = [c for c in df.columns if c.startswith("success")][0]

X = df[feature_cols].values.astype(float)
y = df[target_col].values.astype(int)
X = (X - X.mean(axis=0)) / X.std(axis=0)

# train / test split (80 / 20)
random.seed(42)
indices = list(range(len(X)))
random.shuffle(indices)
split = int(0.8 * len(indices))
train_idx, test_idx = indices[:split], indices[split:]

X_train, y_train = X[train_idx], y[train_idx]
X_test,  y_test  = X[test_idx],  y[test_idx]

N_GENES = len(feature_cols) + 1                 

def predict(chromosome, X_data):
    weights, bias = chromosome[:-1], chromosome[-1]
    preds = []
    for row in X_data:
        score = sum(w * x for w, x in zip(weights, row)) + bias
        preds.append(1 if score > 0 else 0)
    return preds


def accuracy(chromosome, X_data, y_data):
    preds = predict(chromosome, X_data)
    correct = sum(1 for p, t in zip(preds, y_data) if p == t)
    return correct / len(y_data)


def fitness(chromosome):
    return accuracy(chromosome, X_train, y_train)


def create_initial_population(population_size, weight_range=1.0):
    population = []
    for _ in range(population_size):
        chromosome = [random.uniform(-weight_range, weight_range)
                      for _ in range(N_GENES)]
        population.append(chromosome)
    return population


def selection(population, tournament_size=3):
    # tournament selection (generalises your pick-2 version)
    contestants = random.sample(population, tournament_size)
    return max(contestants, key=fitness)


def crossover(parent1, parent2):
    point = random.randint(1, len(parent1) - 1)
    child1 = parent1[:point] + parent2[point:]
    child2 = parent2[:point] + parent1[point:]
    return child1, child2


def mutation(chromosome, mutation_rate, mutation_step=0.3):
    # Gaussian mutation (the real-valued version of your bit-flip)
    for i in range(len(chromosome)):
        if random.random() < mutation_rate:
            chromosome[i] += random.gauss(0, mutation_step)
    return chromosome


def genetic_algorithm(
    population_size=50,
    crossover_rate=0.8,
    mutation_rate=0.1,
    max_generations=100,
    elite_count=2,
    target_accuracy=1.0
):
    population = create_initial_population(population_size)

    best_fitness_history = []
    avg_fitness_history = []

    for generation in range(max_generations):

        fitness_values = [fitness(c) for c in population]
        best_index = fitness_values.index(max(fitness_values))
        best_chromosome = population[best_index]
        best_fitness = fitness_values[best_index]

        best_fitness_history.append(best_fitness)
        avg_fitness_history.append(sum(fitness_values) / len(fitness_values))

        print("Generation:", generation + 1,
              "| Best Accuracy:", round(best_fitness, 4),
              "| Avg Accuracy:", round(avg_fitness_history[-1], 4))

        if best_fitness >= target_accuracy:
            print("\nPerfect training accuracy reached!")
            break

        ranked = sorted(population, key=fitness, reverse=True)
        new_population = [c[:] for c in ranked[:elite_count]]

        # Replacement
        while len(new_population) < population_size:
            parent1 = selection(population)
            parent2 = selection(population)

            if random.random() < crossover_rate:
                child1, child2 = crossover(parent1, parent2)
            else:
                child1, child2 = parent1[:], parent2[:]

            child1 = mutation(child1, mutation_rate)
            child2 = mutation(child2, mutation_rate)

            new_population.append(child1)
            if len(new_population) < population_size:
                new_population.append(child2)

        population = new_population

    fitness_values = [fitness(c) for c in population]
    best_index = fitness_values.index(max(fitness_values))
    best_chromosome = population[best_index]
    best_fitness = fitness_values[best_index]

    return best_chromosome, best_fitness, best_fitness_history, avg_fitness_history


population_size = 50
crossover_rate = 0.8
mutation_rate = 0.1
max_generations = 100

best_chromosome, best_fitness, best_hist, avg_hist = genetic_algorithm(
    population_size, crossover_rate, mutation_rate, max_generations
)

print("\nBest Chromosome (weights + bias):")
for name, w in zip(feature_cols + ["bias"], best_chromosome):
    print(f"  {name:25s} {w:+.4f}")

print("Train Accuracy:", round(best_fitness, 4))
print("Test  Accuracy:", round(accuracy(best_chromosome, X_test, y_test), 4))

plt.figure(figsize=(8, 5))
plt.plot(range(1, len(best_hist) + 1), best_hist, marker='o', label="Best")
plt.plot(range(1, len(avg_hist) + 1), avg_hist, linestyle='--', label="Average")
plt.xlabel("Generation")
plt.ylabel("Accuracy (Fitness)")
plt.title("Genetic Algorithm Convergence - Personality Traits")
plt.legend()
plt.grid(True)
plt.show()