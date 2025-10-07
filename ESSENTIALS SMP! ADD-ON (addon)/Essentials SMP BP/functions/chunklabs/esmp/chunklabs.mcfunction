############################
#  EssentialsSMP DX AD     #
#    by: Chunklabs         #
############################
#  Version: 1.0.0          #
############################

#################################
#    Standard Add-On Code       #
#################################
#Everything is now done with the magic of Scripting API \o/
        #Set-Up (TMRW TMRW TMRW) (runonce)
                execute as @a[c=1,tag=cl_esmp.initialised] at @s run tag @a[tag=!cl_esmp.initialised] add cl_esmp.initialised
                execute as @a[c=1,tag=!cl_esmp.initialised] at @s run function chunklabs/esmp/ro
                tag @a[tag=!cl_esmp.initialised] add cl_esmp.initialised
        #For Every New Player (Give Book)
                execute as @a[c=1,tag=!cl_esmp.initialisedplayer] at @s run function chunklabs/esmp/roeplayer
                tag @a[tag=!cl_esmp.initialisedplayer] add cl_esmp.initialisedplayer




# Unenchanter
# Ore Scanner
# Distance Measurer
# Mob Transporter
# Portable Utilities
# Chunk Visualiser
# Sleeping Bag
# Infinite Lava Source
# Chunk Loader
# 3x3 Pickaxes
# Vertical Slabs
# Sideways Stairs
# Amethyst Farmer
# Backpacks
# Elevator Blocks
# Chest Sorter
# Repairable Anvils
# Quests